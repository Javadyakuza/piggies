-- users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  telegram_id text unique not null,
  wallet_address text,
  current_pig integer default 0,
  fullname text,
  inviter_id uuid references users(id),
  parent_id uuid references users(id),
  referral_id text unique,
  user_type integer not null default 1,
  pig_balance integer default 0,
  created_at timestamp with time zone default now()
);

-- txHistory table
create table if not exists txHistory (
  tx_id text primary key,
  tx_hash text not null,
  wallet_address text not null,
  request_status text check (request_status in ('PigPurchaseApproved', 'PigUpgradePending')),
  upgradedPigLevel integer not null
);

-- rewardsHistory table
create table if not exists rewardsHistory (
  id serial primary key,
  wallet_address text not null,
  reward numeric not null,
  referral text not null,
  related_tx text not null,
  tx_hash text
);