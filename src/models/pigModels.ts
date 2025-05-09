export type PurchasePigRequest = {
  telegram_id: string;
  wallet_address: string;
};

export type PurchasePigResponse = {
  success: boolean;
  message: string;
};

export enum PigLevels {
  Nothing = 0,
  Bronze = 1,
  Silver = 2,
  Gold = 3,
  Diamond = 4,
}

export interface UserPigs {
  wallet_address: string;
  pig_level: PigLevels;
  buyable_pigs: PigLevels;
}
