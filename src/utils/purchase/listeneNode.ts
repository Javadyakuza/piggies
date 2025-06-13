import {
  bountyHuntersResponse,
  extendedPigApprovalEvent,
  extendedPigCreationEvent,
  extendedPigUpgradeEvent,
  extendedWithdrawFromPigEvent,
} from "@/models/purchase";
import { TxId } from "@/models/history";
import { TonApiClient } from "@ton-api/client";
import { Address, Dictionary } from "@ton/core";
webkitURL;
import {
  loadPigApproval,
  loadPigApprovalEvent,
  loadPigCreationEvent,
  loadUpgradePig,
  loadWithdrawFromPigEvent,
  PigCreationEvent,
  PigShop,
  WithdrawFromPigEvent,
} from "../../../build/PigShop/tact_PigShop";

import { findUsersBountyHunters } from "./bountyHunters";
import { getAdminWallet } from "../admin";
import { getTonApiClient, getTonClient } from "../tonClients";
import { get } from "http";
import { sendPigApproval } from "../../scripts/pigApproval";
import {
  getPigs,
  initTxHistory,
  isDuplicatePurchase,
  updateBountyHuntersBalances,
  updateReferralsRewardsHistory,
  updateTxHistory,
  updateUserPiggyBankBalance,
  upgradeUserPig,
  upgradeUserPigAddress,
} from "./dbOps";
import { PigLevel } from "@/models/pigs";
import { WithdrawFromNftPig } from "../../../wrappers/Pig";

async function catchPigShopEvents(listenAddress: Address, afterLt: bigint) {
  const tc = getTonClient();
  const tac = getTonApiClient();
  const adminWallet = await getAdminWallet(tc);
  const pigShop = tc.open(
    PigShop.fromAddress(
      Address.parse(process.env.NEXT_PUBLIC_PIG_SHOP_ADDRESS!)
    )
  );

  const txs = await tac.blockchain.getBlockchainAccountTransactions(
    listenAddress,
    {
      limit: 10,
    }
  );

  if (txs.transactions.length === 0) return afterLt;

  let event:
    | extendedPigUpgradeEvent
    | extendedPigApprovalEvent
    | extendedPigCreationEvent
    | extendedWithdrawFromPigEvent
    | undefined;
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
        "PigApprovalEvent" &&
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
      } else if (
        msg.msgType == "ext_out_msg" &&
        "WithdrawFromPigEvent" &&
        msg.rawBody
      ) {
        try {
          event = {
            ...loadWithdrawFromPigEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          };
        } catch (e) {
          continue;
        }
      } else if (
        msg.msgType == "ext_out_msg" &&
        "PigCreationEvent" &&
        msg.rawBody
      ) {
        try {
          event = {
            ...loadPigCreationEvent(msg.rawBody?.asSlice()),
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
    let pig_data = await getPigs(event.userAddress.toRawString());
    let bh: bountyHuntersResponse = await findUsersBountyHunters(
      event.userAddress.toRawString(),
      pig_data.new_pig_level
    );
    // identifying the event type
    if (event.$$type == "UpgradePig") {
      let tx_id = TxId.create(
        event.userAddress.toRawString(),
        pig_data.old_pig_level
      );
      if (
        !(await isDuplicatePurchase(
          event.userAddress.toRawString(),
          pig_data.old_pig_level
        ))
      ) {
        // the purchase have been initiated and the tokens are received by the "pigsShop" contract
        console.log(
          `Upgrade pig request initiated wallet address${event.userAddress}`
        );

        // sending the approval message to the pig shop to distribute the tokens to the bounty hunters
        await sendPigApproval(
          bh,
          adminWallet,
          pigShop,
          pig_data.address,
          event.userAddress.toRawString()
        );

        // update users transaction history
        await initTxHistory({
          tx_id,
          tx_hash: event.tx_hash,
          wallet_address: event.userAddress.toRawString(),
          request_status: "PigUpgradePending",
          upgraded_pig_level: pig_data.new_pig_level,
        });
      }
    }
    if (event.$$type == "PigApprovalEvent") {
      console.log(
        `approval received for wallet address ${event.userAddress} pig upgrade request`
      );
      event.referrer = Dictionary.empty<Address, bigint>().set(
        event.referrerNftAddress,
        event.referrerAmount
      );
      // the tokens have been distributed, updating the db
      await updateBountyHuntersBalances({
        referrer: event.referrer,
        users: event.userBountyHunters,
        admins: event.adminsShares,
      });

      // the user current pig should be upgraded
      await upgradeUserPig(event.userAddress.toRawString());

      // update users transaction history
      await updateTxHistory({
        tx_id: TxId.create(
          event.userAddress.toRawString(),
          pig_data.old_pig_level
        ),
        tx_hash: event.tx_hash,
        wallet_address: event.userAddress.toRawString(),
        request_status: "PigPurchaseApproved",
        upgraded_pig_level: pig_data.new_pig_level,
      });

      event.referrer = Dictionary.empty<Address, bigint>().set(
        event.referrerNftAddress,
        event.referrerAmount
      );
      // update the referrals rewards history
      let updateRes = await updateReferralsRewardsHistory(event);

      if (!updateRes) {
        throw new Error("Failed to update referrals rewards history!");
      }
    }
    if (event.$$type == "PigCreationEvent") {
      // updating the user pig address on the db
      await upgradeUserPigAddress(
        event.userAddress.toRawString(),
        event.nft.toRawString()
      );
    }

    if (event.$$type === "WithdrawFromPigEvent") {
      // updating the user pig address on the db
      await updateUserPiggyBankBalance(
        event.userAddress.toRawString(),
        event.nft.toRawString(),
        event.amount
      );
    }
  }

  return txs.transactions[txs.transactions.length - 1].lt;
}

export async function listenPigShopForever() {
  let lastLt = BigInt(0);
  while (true) {
    lastLt = await catchPigShopEvents(
      Address.parse(process.env.NEXT_PUBLIC_PIG_SHOP_ADDRESS!),
      lastLt
    );
  }
}
