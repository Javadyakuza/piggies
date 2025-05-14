import { hash } from "crypto";
import { PigApprovalEvent, UpgradePig } from "../../wrappers/PigShop";
export type txId = string;

export class TxId {
  static create(wallet_address: string, current_pig_level: number): txId {
    return hash("sha256", `${wallet_address}_${current_pig_level}`, "hex");
  }
}

export type txHistory = {
  tx_id: txId;
  tx_hash: string;
  wallet_address: string;
  request_status: "PigPurchaseApproved" | "PigUpgradePending";
};
