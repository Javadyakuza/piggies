import { Address, Dictionary } from "@ton/ton";
import { hash } from "crypto";
import { PigApproval, PigApprovalEvent, UpgradePig } from "../../wrappers/PigShop";


export type PurchasePigRequest = {
  telegram_id: string;
  wallet_address: string;
};

export type PurchasePigResponse = {
  success: boolean;
  message: txHistory | string;
};

export interface bountyHuntersResponse {
  users: Dictionary<Address, bigint>;
  admins: Dictionary<Address, bigint>;
}

export type upgradeUserPigsInternalResponse = { 
    old_pig_level: number;
    new_pig_level: number;
}

export type txId = string;

export class TxId {
  static create(wallet_address: string, current_pig_level: number): txId {
    return hash("sha256", `${wallet_address}_${current_pig_level}`, "hex");
  }
}

// 1 - upgrade pig
// 2 - approve pig
// 3 - receive rewards
export type txHistory = {
  tx_id: txId;
  tx_hash: string;
  wallet_address: string;
  request_status: "PigPurchaseApproved" | "PigUpgradePending";
};

export interface extendedPigUpgradeEvent extends UpgradePig {
    tx_hash: string;
}

export interface extendedPigApprovalEvent extends PigApprovalEvent {
    tx_hash: string;
}