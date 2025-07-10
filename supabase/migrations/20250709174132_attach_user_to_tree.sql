CREATE OR REPLACE FUNCTION attach_user_to_tree(
    p_user_id    bigint,   -- the user that already exists
    p_inviter_id bigint    -- root of the subtree we insert into
) RETURNS bigint
LANGUAGE plpgsql AS

$$
DECLARE
v_parent_id bigint;
BEGIN
    -------------------------------------------------------------------
    -- 1. Find the nearest node in the inviter’s subtree
    --    that currently has < 3 children.
    --    Lock it so nobody else can grab the same spot.
    -------------------------------------------------------------------
WITH RECURSIVE subtree AS (
    SELECT id, 0 AS depth
    FROM   users
    WHERE  id = p_inviter_id                     -- root

    UNION ALL

    SELECT u.id, s.depth + 1
    FROM   users u
               JOIN   subtree s  ON u.parent_id = s.id      -- walk downward
)
SELECT u.id
INTO   v_parent_id
FROM   users u
           JOIN   subtree s USING (id)
WHERE  (SELECT count(*)
        FROM   users c
        WHERE  c.parent_id = u.id) < 3           -- free socket?
ORDER  BY s.depth, u.id                          -- nearest first
    FOR UPDATE SKIP LOCKED                           -- lock the row
    LIMIT  1;

IF NOT FOUND THEN
        RAISE EXCEPTION
          'inviter_id % does not exist, or its subtree is inaccessible',
          p_inviter_id;
END IF;

    -------------------------------------------------------------------
    -- 2. Attach the existing user to the chosen parent
    -------------------------------------------------------------------
UPDATE users
SET    parent_id  = v_parent_id
WHERE  id = p_user_id;

RETURN v_parent_id;                              -- tell caller
END;

$$;