import {
  bountyHuntersResponse,
  extendedPigApprovalEvent,
  extendedPigUpgradeEvent,
  TxId,
} from "@/models/purchaseModels";
import { TonApiClient } from "@ton-api/client";
import { Address } from "@ton/core";
webkitURL;
import {
  loadPigApproval,
  loadPigApprovalEvent,
  loadUpgradePig,
  PigShop,
} from "../../../build/PigShop/tact_PigShop";

import { findUsersBountyHunters } from "./bountyHunters";
import { getAdminWallet } from "../admin";
import { getTonApiClient, getTonClient } from "../tonClients";
import { get } from "http";
import { sendPigApproval } from "../../../scripts/pigApproval";
import {
  updateBountyHuntersBalances,
  updateReferralsRewardsHistory,
  updateTxHistory,
  upgradeUserPig,
} from "./dbOps";

async function catchEvents(listenAddress: Address, afterLt: bigint) {
  const tc = getTonClient();
  const tac = getTonApiClient();
  const adminWallet = await getAdminWallet(tc);
  const pigShop = tc.open(
    PigShop.fromAddress(Address.parse(process.env.PIG_SHOP_ADDRESS!))
  );

  const txs = await tac.blockchain.getBlockchainAccountTransactions(
    listenAddress,
    {
      limit: 10,
    }
  );

  if (txs.transactions.length === 0) return afterLt;

  let event: extendedPigUpgradeEvent | extendedPigApprovalEvent | undefined;
  for (const tx of txs.transactions) {
    // tx must be successful
    if (!tx.computePhase?.success || !tx.actionPhase?.success || tx.aborted)
      continue;
    // tx must have a body
    if (tx.inMsg?.rawBody === undefined) continue;
    for (const msg of tx.outMsgs) {
      if (
        msg.msgType == "ext_out_msg" &&
        msg.decodedOpName == "UpgradePig" &&
        msg.rawBody
      ) {
        try {
          event = {
            ...loadUpgradePig(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          };
        } catch (e) {
          continue;
        }
      } else if (
        msg.msgType == "ext_out_msg" &&
        "pig_approval" &&
        msg.rawBody
      ) {
        try {
          event = {
            ...loadPigApprovalEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          };
        } catch (e) {
          continue;
        }
      }
    }
  }

  // handle if any purchase related events was found
  if (event && event.userAddress) {
    // finding the relative user and its reward receiver
    let bh: bountyHuntersResponse = await findUsersBountyHunters(
      event.userAddress.toString()
    );
    // identifying the event type
    if (event.$$type == "UpgradePig") {
      // the purchase have been initated and the tokens are received by the "pigsShop" contract
      console.log(
        `Upgrade pig request initiated wallet address${event.userAddress}`
      );

      // sending the approval message to the pig shop to distribute the tokens to the bounty hunters
      await sendPigApproval(bh, adminWallet, pigShop);

      // update users transaction history
      await updateTxHistory({
        tx_id: TxId.create(event.userAddress.toString(), 1),
        tx_hash: event.tx_hash,
        wallet_address: event.userAddress.toString(),
        tx_type: 1,
      });
    }
    if (event.$$type == "PigApprovalEvent") {
      console.log(
        `approval received for wallet address ${event.userAddress} pig upgrade request`
      );

      // the tokens have been distributed, updating the db
      await updateBountyHuntersBalances(bh);

      // the user current pig should be upgraded
      let pig_data = await upgradeUserPig(event.userAddress.toString());

      // update users transaction history
      await updateTxHistory({
        tx_id: TxId.create(
          event.userAddress.toString(),
          pig_data.old_pig_level
        ),
        tx_hash: event.tx_hash,
        wallet_address: event.userAddress.toString(),
        tx_type: 2,
      });

      // update the referrals rewards history 
      let updateRes = await updateReferralsRewardsHistory(event);

      if (!updateRes) {
        console.error("Failed to update referrals rewards history!");
      }
    }
  }

  return txs.transactions[txs.transactions.length - 1].lt;
}

export async function listenForever() {
  let lastLt = BigInt(0);
  while (true) {
    lastLt = await catchEvents(
      Address.parse(process.env.PIG_SHOP_ADDRESS!),
      lastLt
    );
  }
}
