-- Drop foreign key constraints from txHistory
ALTER TABLE public."txHistory" DROP CONSTRAINT IF EXISTS txHistory_wallet_address_fkey;

-- Drop txHistory table
DROP TABLE IF EXISTS public."txHistory";

-- Drop foreign key constraints from rewardsHistory
ALTER TABLE public."rewardsHistory" DROP CONSTRAINT IF EXISTS rewardHistory_referral_fkey;
ALTER TABLE public."rewardsHistory" DROP CONSTRAINT IF EXISTS rewardHistory_wallet_address_fkey;

-- Drop rewardsHistory table
DROP TABLE IF EXISTS public."rewardsHistory";

-- Drop appData table
DROP TABLE IF EXISTS public."appData";

-- Drop foreign key constraints from users
ALTER TABLE public."users" DROP CONSTRAINT IF EXISTS users_inviter_id_fkey;
ALTER TABLE public."users" DROP CONSTRAINT IF EXISTS users_parent_id_fkey;

-- Drop users table
DROP TABLE IF EXISTS public."users";
