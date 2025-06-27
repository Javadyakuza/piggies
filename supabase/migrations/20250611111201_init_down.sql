
-- Drop tables in reverse dependency order to avoid foreign key constraint errors

-- 1. Drop tx_history table (references users)
DROP TABLE IF EXISTS public.tx_history;

-- 2. Drop rewards_history table (references users)
DROP TABLE IF EXISTS public.rewards_history;

-- 3. Drop appData table (no foreign keys)
DROP TABLE IF EXISTS public.appData;

-- 4. Drop users table (self-referencing, so drop last)
DROP TABLE IF EXISTS public.users;