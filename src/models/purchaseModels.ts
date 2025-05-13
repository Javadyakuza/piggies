import { Address, Dictionary } from "@ton/ton";
import { hash } from "crypto";
import { PurchaseEvent } from "../../wrappers/PigShop";

export type PurchasePigRequest = {
  telegram_id: string;
  wallet_address: string;
};

export type PurchasePigResponse = {
  success: boolean;
  message: txHistory[] | string;
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
  tx_type: 1 | 2 | 3;
};

export interface extendedPurchaseEvent extends PurchaseEvent {
    tx_hash: string;
}