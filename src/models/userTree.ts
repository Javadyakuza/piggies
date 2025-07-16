export type User = {
  telegram_id: string;
  wallet_address: string;
  current_pig: number;
  fullname: string;
  inviter_id: string;
  total_invited: number;
  total_under?: number;
  user_type: number;
};

export interface ReferralResponse {
  [depth: number]: {
    [pig_level: number]: number;
  };
}

export interface SelfReferralId {
  referral_id: string;
}

export type SetWalletRequest = {
  telegram_id: string;
  wallet_address: string;
};

export type ReferralRequest = {
  telegram_id: string;
  referrals: string;
  wallet_address: string
};

export type InviteeRequest = {
  telegram_id: string;
  wallet_address: string
};


export type batchReferralsRequest = {
  wallet_address: string;
}