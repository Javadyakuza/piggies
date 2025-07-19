CREATE OR REPLACE FUNCTION get_referral_tree_aggregated(user_id bigint, max_depth integer DEFAULT 12)
RETURNS TABLE (
  depth integer,
  current_pig smallint,
  users_count bigint
) AS $$
BEGIN
RETURN QUERY
    WITH RECURSIVE referral_tree AS (
    -- Base case: start with your user ID
    SELECT
      u.id,
      u.current_pig,
      0 as depth
    FROM users u
    WHERE u.id = user_id

    UNION ALL

    -- Recursive case: find all children
    SELECT
      u.id,
      u.current_pig,
      rt.depth + 1
    FROM users u
    INNER JOIN referral_tree rt ON u.parent_id = rt.id
    WHERE rt.depth < max_depth
  )
SELECT
    rt.depth,
    rt.current_pig,
    COUNT(*) as users_count
FROM referral_tree rt
WHERE rt.depth > 0  -- Exclude yourself (depth 0)
GROUP BY rt.depth, rt.current_pig
ORDER BY rt.depth, rt.current_pig;
END;

$$ LANGUAGE plpgsql;
