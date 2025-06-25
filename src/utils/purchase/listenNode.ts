import {
  bountyHuntersResponse,
  extendedPigApprovalEvent,
  extendedPigCreationEvent,
  extendedPigUpgradeEvent,
  extendedWithdrawFromPigEvent,
} from "../../models/purchase";
import { TxId } from "../../models/history";
import { TonApiClient } from "@ton-api/client";
import { Address, contractAddress, Dictionary } from "@ton/core";
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
import { sendPigApproval } from "../../../scripts/pigApproval";
import {
  getParentId,
  getPigs,
  initTxHistory,
  isDuplicatePurchase,
  updateBountyHuntersBalances,
  updateReferralsRewardsHistory,
  updateTxHistory,
  UpdateUSerInTree,
  updateUserPiggyBankBalance,
  upgradeUserPig,
  upgradeUserPigAddress,
} from "./dbOps";
import { PigLevel } from "../../models/pigs";
import { WithdrawFromNftPig } from "../../../wrappers/Pig";
import { ContractAddresses } from "../../../scripts/constants";
import { fileSystemLogger } from "../fsLogger";
import { getUser } from "../history-helper";
import { PigCollection } from "../../../wrappers/PigCollection";

async function catchPigShopEvents(after_lt?: bigint) {
  console.log("➡️ Starting to catch PigShop events");
  fileSystemLogger.log("➡️ Starting to catch PigShop events");
  console.log("🔍 Listen address:", ContractAddresses.pigShop.toString());
  fileSystemLogger.log(
    "🔍 Listen address:",
    ContractAddresses.pigShop.toString()
  );
  console.log("📌 Last known lt:", after_lt?.toString());
  fileSystemLogger.log("📌 Last known lt:", after_lt?.toString());
  fileSystemLogger.log("📌 Last known lt:", after_lt?.toString());

  const tc = getTonClient();
  const tac = getTonApiClient();
  const adminWallet = await getAdminWallet(tc);

  console.log("👛 Admin wallet loaded:", adminWallet.address.toString());
  fileSystemLogger.log(
    "👛 Admin wallet loaded:",
    adminWallet.address.toString()
  );

  const pigShop = tc.open(PigShop.fromAddress(ContractAddresses.pigShop));

  console.log("🏪 PigShop contract opened at:", pigShop.address.toString());
  fileSystemLogger.log(
    "🏪 PigShop contract opened at:",
    pigShop.address.toString()
  );

  const txs = await tac.blockchain.getBlockchainAccountTransactions(
    ContractAddresses.pigShop,
    {
      limit: after_lt ? 10 : 1,
      after_lt
    }
  );

  if (txs && txs.transactions.length === 0) {
    console.log("⚠️ No new transactions found");
    fileSystemLogger.log("⚠️ No new transactions found");
    return after_lt;
  }
  console.log("📦 Transactions fetched:", txs.transactions.length);
  fileSystemLogger.log("📦 Transactions fetched:", txs.transactions.length);

  let events: Array<
    | extendedPigUpgradeEvent
    | extendedPigApprovalEvent
    | extendedPigCreationEvent
    | extendedWithdrawFromPigEvent
    | undefined> = [];

  for (const tx of txs.transactions) {
    console.log("🔁 Processing transaction:", tx.hash);
    fileSystemLogger.log("🔁 Processing transaction:", tx.hash);

    if (!tx.computePhase?.success || !tx.actionPhase?.success || tx.aborted) {
      console.log("🚫 Skipped aborted or failed tx:", tx.hash);
      fileSystemLogger.log("🚫 Skipped aborted or failed tx:", tx.hash);
      continue;
    }

    if (tx.inMsg?.rawBody === undefined) {
      console.log("⚠️ Skipped tx with no body:", tx.hash);
      fileSystemLogger.log("⚠️ Skipped tx with no body:", tx.hash);
      continue;
    }

    for (const msg of tx.outMsgs) {
      console.log(
        "💬 Out message:",
        Object.entries({ ...PigCollection.opcodes, ...PigShop.opcodes }).find(
          ([key, value]) => BigInt(value) === msg.opCode
        )?.[0]
      );
      fileSystemLogger.log(
        "💬 Out message:",
        Object.entries({ ...PigCollection.opcodes, ...PigShop.opcodes }).find(
          ([key, value]) => BigInt(value) === msg.opCode
        )?.[0]
      );

      try {
        if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.UpgradePig) &&
          msg.rawBody
        ) {
          events.push({
            ...loadUpgradePig(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          });
          console.log("✅ Detected UpgradePig event");
          fileSystemLogger.log("✅ Detected UpgradePig event");
        } else if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.PigApprovalEvent) &&
          msg.rawBody
        ) {
          events.push({
            ...loadPigApprovalEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          });
          console.log("✅ Detected PigApprovalEvent");
          fileSystemLogger.log("✅ Detected PigApprovalEvent");
        } else if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.WithdrawFromPigEvent) &&
          msg.rawBody
        ) {
          events.push({
            ...loadWithdrawFromPigEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          });
          console.log("✅ Detected WithdrawFromPigEvent");
          fileSystemLogger.log("✅ Detected WithdrawFromPigEvent");
        } else if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.PigCreationEvent) &&
          msg.rawBody
        ) {
          events.push({
            ...loadPigCreationEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          });
          console.log("✅ Detected PigCreationEvent");
          fileSystemLogger.log("✅ Detected PigCreationEvent");
        }
      } catch (e) {
        console.log("❌ Error decoding message:", msg.decodedOpName, e);
        fileSystemLogger.log(
          "❌ Error decoding message:",
          msg.decodedOpName,
          e
        );
        continue;
      }
    }
  }
  console.log("the parsed events are", events);
  fileSystemLogger.log("the parsed events are", events);
  if (!after_lt) {
    const nextLt = txs.transactions[txs.transactions.length - 1].lt;
    console.log("⏭️Not processing the old event and Returning next lt:", nextLt.toString());
    fileSystemLogger.log("⏭️ ⏭️Not processing the old event and Returning next lt:", nextLt.toString());

    return nextLt;
  }

  for (const event of events) {
  if (event && event.userAddress) {
    console.log("📍 Processing event for user:", event.userAddress.toString());
    fileSystemLogger.log(
      "📍 Processing event for user:",
      event.userAddress.toString()
    );

    const userAddr = event.userAddress.toRawString();
    let user = await getUser(userAddr);
    const pig_data = await getPigs(userAddr);
    console.log("🐷 Pig data loaded:", pig_data);
    fileSystemLogger.log("🐷 Pig data loaded:", pig_data);

    const bh = await findUsersBountyHunters(userAddr, pig_data.new_pig_level);
    console.log("🏹 Bounty hunters fetched:", bh);
    fileSystemLogger.log("🏹 Bounty hunters fetched:", bh);

    if (event.$$type === "UpgradePig") {
      console.log("🛠️ Handling UpgradePig event");
      fileSystemLogger.log("🛠️ Handling UpgradePig event");

      const isDup = await isDuplicatePurchase(userAddr, pig_data.old_pig_level);
      console.log("🔁 Is duplicate purchase?", isDup);
      fileSystemLogger.log("🔁 Is duplicate purchase?", isDup);

      if (!isDup) {
        console.log("⁉️ UpgradePig tx initiated check for potential user tree update ...");
        fileSystemLogger.log("⁉️ UpgradePig tx initiated check for potential user tree update ...");

        if (pig_data.address === null && user.parent_id === null) {
          console.log("🆗 User parent should be updated since the tx is definitely going through");
          fileSystemLogger.log("🆗 User parent should be updated since the tx is definitely going through");
          let ids = await getParentId(userAddr);
          if (ids.pi) {
            console.log("🔁 Updating the user parent id...");
            fileSystemLogger.log("🔁 Updating the user parent id...");
            await UpdateUSerInTree(userAddr, ids.pi);
          }
        }

        const bh = await findUsersBountyHunters(userAddr, pig_data.new_pig_level);

        const tx_id = TxId.create(userAddr, pig_data.old_pig_level);

        console.log("🚀 Sending pig approval message");
        fileSystemLogger.log("🚀 Sending pig approval message");
        await sendPigApproval(
          bh,
          adminWallet,
          pigShop,
          pig_data.address,
          userAddr
        );

        await initTxHistory({
          tx_id,
          tx_hash: event.tx_hash,
          wallet_address: userAddr,
          request_status: "PigUpgradePending",
          upgraded_pig_level: pig_data.new_pig_level,
        });

        console.log("📜 Tx history initialized for UpgradePig");
        fileSystemLogger.log("📜 Tx history initialized for UpgradePig");
      }
    }

    if (event.$$type === "PigApprovalEvent") {
      console.log("✅ Approval received for:", userAddr);
      fileSystemLogger.log("✅ Approval received for:", userAddr);

      event.referrer = Dictionary.empty<Address, bigint>();
      if (event.referrerNftAddress != null) {
        event.referrer.set(
          event.referrerNftAddress,
          event.referrerAmount
        );
      }

      //-----------------------------------------
      // update the bounty hunter balances (piggy_bank_balance on the users table)
      //-----------------------------------------
      await updateBountyHuntersBalances({
        referrer: event.referrer,
        users: event.userBountyHunters,
        admins: event.adminsShares,
      });

      //-----------------------------------------
      // update the user pig (current_pig on the users table)
      //-----------------------------------------
      await upgradeUserPig(userAddr);

      //-----------------------------------------
      // update the transaction history (tx_history table)
      //-----------------------------------------
      await updateTxHistory({
        tx_id: TxId.create(userAddr, pig_data.old_pig_level),
        tx_hash: event.tx_hash,
        wallet_address: userAddr,
        request_status: "PigPurchaseApproved",
        upgraded_pig_level: pig_data.new_pig_level,
      });

      //-----------------------------------------
      // update the referrals rewards history (rewards_history table)
      //-----------------------------------------
      const updateRes = await updateReferralsRewardsHistory(event);
      console.log("📦 Referral reward update:", updateRes);
      fileSystemLogger.log("📦 Referral reward update:", updateRes);

      if (!updateRes)
        throw new Error("Failed to update referrals rewards history!");
    }

    if (event.$$type === "PigCreationEvent") {
      console.log("🐣 Handling PigCreationEvent");
      fileSystemLogger.log("🐣 Handling PigCreationEvent");
      //-----------------------------------------
      // update the user pig address (pig_address on the users table)
      //-----------------------------------------
      await upgradeUserPigAddress(userAddr, event.nft.toRawString());
      console.log("✅ User pig address upgraded");
      fileSystemLogger.log("✅ User pig address upgraded");
    }

    if (event.$$type === "WithdrawFromPigEvent") {
      console.log("🏧 Handling WithdrawFromPigEvent");
      fileSystemLogger.log("🏧 Handling WithdrawFromPigEvent");
      //-----------------------------------------
      // update the user piggy bank balance (piggy_bank_balance on the users table)
      //-----------------------------------------

      await updateUserPiggyBankBalance(
        userAddr,
        event.nft.toRawString(),
        event.amount
      );
      console.log("💰 User piggy bank balance updated");
      fileSystemLogger.log("💰 User piggy bank balance updated");
    }
    
  } else {
    console.log("⚠️ No event with userAddress was detected");
    fileSystemLogger.log("⚠️ No event with userAddress was detected");
  }
}

  const nextLt = txs.transactions[txs.transactions.length - 1].lt;
  console.log("⏭️ Returning next lt:", nextLt.toString());
  fileSystemLogger.log("⏭️ Returning next lt:", nextLt.toString());

  return nextLt;
}

export async function listenPigShopForever() {
  console.log("🔁 Starting to listen for PigShop events");
  fileSystemLogger.log("🔁 Starting to listen for PigShop events");
  try {
    let lastLt;
    while (true) {
      try {
        lastLt = await catchPigShopEvents(lastLt);

        // waiting for 1 second before checking the next lt
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Error in listenPigShopForever:", error);
        fileSystemLogger.error("Error in listenPigShopForever:", error);
        console.log("restarting...");
        fileSystemLogger.log("restarting...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    console.error("Error in listenPigShopForever:", error);
    fileSystemLogger.error("Error in listenPigShopForever:", error);
    console.log("restarting...");
    fileSystemLogger.log("restarting...");
  }
}
