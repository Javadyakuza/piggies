import { Address, Dictionary } from "@ton/ton";

import {
  PigApproval,
  PigApprovalEvent,
  UpgradePig,
} from "../../wrappers/PigShop";
import { txHistory } from "./history";
import { PigLevel } from "./pigs";

export type PurchasePigRequest = {
  telegram_id: string;
  wallet_address: string;
};

export type PurchasePigResponse = {
  success: boolean;
  message: txHistory | UpgradePigTx | string;
};

export interface bountyHuntersResponse {
  users: Dictionary<Address, bigint>;
  admins: Dictionary<Address, bigint>;
}

export type upgradeUserPigsInternalResponse = {
  old_pig_level: PigLevel;
  new_pig_level: PigLevel;
};

export interface extendedPigUpgradeEvent extends UpgradePig {
  tx_hash: string;
}

export interface extendedPigApprovalEvent extends PigApprovalEvent {
  tx_hash: string;
}

export interface UpgradePigTx {
  tx: {
    validUntil: number;
    messages: {
      address: string;
      amount: string;
      payload: string;
    }[];
  };
  pigLevel: PigLevel;
}
