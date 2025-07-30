CREATE TABLE public.pig_levels (
    level smallint PRIMARY KEY,
    price bigint NOT NULL,
    balance_limit bigint NOT NULL
);

INSERT INTO public.pig_levels (level, price, balance_limit) VALUES
    (1, 100000000, 100000000),   -- price: 0.1 TON, limit: 0.10 TON
    (2, 200000000, 250000000),   -- price: 0.2 TON, limit: 0.25 TON
    (3, 300000000, 500000000),   -- price: 0.3 TON, limit: 0.50 TON
    (4, 400000000, 750000000);   -- price: 0.4 TON, limit: 0.75 TON

CREATE OR REPLACE FUNCTION increment_piggy_bank_balance(
  wallet_address_in text,
  amount_in bigint
)
RETURNS TABLE (
  id bigint,
  wallet_address text,
  current_pig smallint,
  piggy_bank_balance bigint
) AS $$
DECLARE
balance_limit bigint;
current_pig_level smallint;
BEGIN
  -- Lock the user row and get current pig level
SELECT u.current_pig
INTO current_pig_level
FROM users u
WHERE u.wallet_address = wallet_address_in
    FOR UPDATE;

-- Get balance limit from pig_levels, fallback to max bigint if not found
SELECT COALESCE(pl.balance_limit, 9223372036854775807)
INTO balance_limit
FROM pig_levels pl
WHERE pl.level = current_pig_level;

-- Update the balance, clamp to balance_limit
UPDATE users u
SET piggy_bank_balance = LEAST(u.piggy_bank_balance + amount_in, balance_limit)
WHERE u.wallet_address = wallet_address_in;

-- Return updated row
RETURN QUERY
SELECT u.id, u.wallet_address, u.current_pig, u.piggy_bank_balance
FROM users u
WHERE u.wallet_address = wallet_address_in;
END;
$$ LANGUAGE plpgsql;
