export type User = {
  telegram_id: string;
  wallet_address: string;
  current_pig: number;
  fullname: string;
  inviter_id: string;
  total_invited: number;
  total_under?: number;
};

export interface ReferralLevel {
  count: number;
  total: number;
  users: User[];
}

export interface ReferralResponse {
  [key: string]: ReferralLevel | number;
}

export interface SelfReferralId {
  referral_id: string;
}
