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
BEGIN
  -- Set limit based on current_pig
SELECT CASE u.current_pig
           WHEN 1 THEN 100000000 -- 0.1 TON
           WHEN 2 THEN 250000000 -- 0.25 TON
           WHEN 3 THEN 500000000 -- 0.5 TON
           WHEN 4 THEN 750000000 -- 0.75 TON
           ELSE 9223372036854775807 -- fallback: no limit
           END
INTO balance_limit
FROM users u
WHERE u.wallet_address = wallet_address_in
    FOR UPDATE;

-- Update the balance, clamp to balance_limit
UPDATE users u
SET piggy_bank_balance = LEAST(u.piggy_bank_balance + amount_in, balance_limit)
WHERE u.wallet_address = wallet_address_in;

RETURN QUERY SELECT u.id, u.wallet_address, u.current_pig, u.piggy_bank_balance FROM users u WHERE u.wallet_address = wallet_address_in;
END;

$$ LANGUAGE plpgsql;