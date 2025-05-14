import { Address, Dictionary } from "@ton/ton";

import { PigApproval, PigApprovalEvent, UpgradePig } from "../../wrappers/PigShop";
import { txHistory } from "./history";


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

export interface extendedPigUpgradeEvent extends UpgradePig {
  tx_hash: string;
}

export interface extendedPigApprovalEvent extends PigApprovalEvent {
  tx_hash: string;
}

