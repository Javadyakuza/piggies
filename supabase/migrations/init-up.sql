
CREATE TABLE public.appData (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tier text NOT NULL UNIQUE,
  price_in_usd text NOT NULL,
  price_in_ton text NOT NULL,
  CONSTRAINT appData_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rewardsHistory (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  wallet_address text NOT NULL,
  reward integer NOT NULL,
  referral text NOT NULL,
  related_tx text NOT NULL,
  CONSTRAINT rewardsHistory_pkey PRIMARY KEY (id),
  CONSTRAINT rewardHistory_referral_fkey FOREIGN KEY (referral) REFERENCES public.users(wallet_address),
  CONSTRAINT rewardHistory_wallet_address_fkey FOREIGN KEY (wallet_address) REFERENCES public.users(wallet_address)
);
CREATE TABLE public.txHistory (
  tx_id text NOT NULL,
  tx_hash text NOT NULL UNIQUE,
  wallet_address text NOT NULL,
  request_status text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  upgradedPigLevel integer,
  CONSTRAINT txHistory_pkey PRIMARY KEY (tx_id, tx_hash),
  CONSTRAINT txHistory_wallet_address_fkey FOREIGN KEY (wallet_address) REFERENCES public.users(wallet_address)
);
CREATE TABLE public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  telegram_id text NOT NULL,
  inviter_id bigint,
  parent_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  referral_id uuid DEFAULT gen_random_uuid() UNIQUE,
  wallet_address text UNIQUE,
  current_pig smallint NOT NULL DEFAULT '0'::smallint,
  fullname text DEFAULT ''::text,
  piggy_bank_balance bigint DEFAULT '0'::bigint,
  user_type smallint NOT NULL DEFAULT '1'::smallint,
  pig_address text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id),
  CONSTRAINT users_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id)
);
