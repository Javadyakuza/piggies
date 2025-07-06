import crypto from "crypto";
import { PigApprovalEvent, UpgradePig } from "../../wrappers/PigShop";
import { PigLevel } from "./pigs";
export type txId = string;

export class TxId {
  static create(wallet_address: string, current_pig_level: number): txId {
    const data = `${wallet_address}_${current_pig_level}`;
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    return hash;
  }
}

export type txHistory = {
  tx_id: txId;
  tx_hash: string;
  wallet_address: string;
  request_status: "PigPurchaseApproved" | "PigUpgradePending";
  upgraded_pig_level: PigLevel;
};

export type rewardHistory = {
  related_tx: string;
  reward: number;
  referral: string;
  wallet_address: string;
};

export type rewardHistoryResponse = {
  success: boolean;
  message: rewardHistory[] | string;
};

export interface rewardsHistoryRequest {
  telegram_id: string;
}

export interface txRewardHistoryRequest {
  tx_hash: string;
  telegram_id: string;
}

export interface UserHistory {
  created_at: string;
  fullname: string;
  upgraded_pig_level: PigLevel;
  self_balance_change: number;
  referral_depth?: number;
}
