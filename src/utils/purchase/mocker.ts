import {
  bountyHuntersResponse,
  extendedPigApprovalEvent,
} from "@/models/purchase";
import { findUsersBountyHunters } from "./bountyHunters";
import {
  getPigs,
  initTxHistory,
  updateBountyHuntersBalances,
  updateReferralsRewardsHistory,
  updateTxHistory,
  upgradeUserPig,
} from "./dbOps";
import { txHistory, TxId } from "@/models/history";
import * as crypto from "crypto";
import { Address } from "@ton/ton";
import { PigLevel } from "@/models/pigs";
import { init } from "@/core/init";

export async function mockPigPurchase(wallet_address: string) {
  let walletAddr = Address.parse(wallet_address).toRawString();
  let pig_data = await getPigs(walletAddr);
  let bh: bountyHuntersResponse = await findUsersBountyHunters(
    walletAddr,
    pig_data.new_pig_level
  );

  let tx_id = TxId.create(walletAddr, pig_data.new_pig_level);

  // the tokens have been distributed, updating the db
  await updateBountyHuntersBalances(bh);
  // the user current pig should be upgraded
  await upgradeUserPig(walletAddr);

  let txHash = txHashGen();

  let tx: txHistory = {
    tx_id,
    tx_hash: txHash,
    wallet_address: walletAddr,
    request_status: "PigPurchaseApproved",
    upgraded_pig_level: pig_data.new_pig_level,
  };

  // init the tx history
  await initTxHistory(tx);

  // update users transaction history
  await updateTxHistory(tx);

  let exEventData: extendedPigApprovalEvent = {
    tx_hash: txHash,
    $$type: "PigApprovalEvent",
    userAddress: Address.parse(walletAddr),
    userBountyHunters: bh.users,
    adminsShares: bh.admins,
    referrer: bh.referrer,
    referrerNftAddress: bh.referrer.keys()[0],
    referrerAmount: bh.referrer.values()[0],
  };

  // update the referrals rewards history
  let _ = await updateReferralsRewardsHistory(exEventData);
  return {
    success: true,
    message: tx,
  };
}

function txHashGen(): string {
  const timestamp = Date.now().toString(); // current time in ms
  const randomPart = Math.random().toString(); // small random value
  const raw = timestamp + randomPart;

  // Hash it using SHA-256
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return hash;
}
