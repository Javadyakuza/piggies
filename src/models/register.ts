export type RegisterRequest = {
  telegram_id: string;
  wallet_address: string;
  fullname: string;
  referral_id: string | number;
};