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
import { PigLevel } from "../../models/pigs";
import { WithdrawFromNftPig } from "../../../wrappers/Pig";
import { ContractAddresses } from "../../../scripts/constants";

// async function catchPigShopEvents(listenAddress: Address, afterLt: bigint) {
//   const tc = getTonClient();
//   const tac = getTonApiClient();
//   const adminWallet = await getAdminWallet(tc);
//   const pigShop = tc.open(
//     PigShop.fromAddress(
//       Address.parse(process.env.NEXT_PUBLIC_PIG_SHOP_ADDRESS!)
//     )
//   );

//   const txs = await tac.blockchain.getBlockchainAccountTransactions(
//     listenAddress,
//     {
//       limit: 10,
//     }
//   );

//   if (txs.transactions.length === 0) return afterLt;

//   let event:
//     | extendedPigUpgradeEvent
//     | extendedPigApprovalEvent
//     | extendedPigCreationEvent
//     | extendedWithdrawFromPigEvent
//     | undefined;
//   for (const tx of txs.transactions) {
//     // tx must be successful
//     if (!tx.computePhase?.success || !tx.actionPhase?.success || tx.aborted)
//       continue;
//     // tx must have a body
//     if (tx.inMsg?.rawBody === undefined) continue;
//     for (const msg of tx.outMsgs) {
//       if (
//         msg.msgType == "ext_out_msg" &&
//         msg.decodedOpName == "UpgradePig" &&
//         msg.rawBody
//       ) {
//         try {
//           event = {
//             ...loadUpgradePig(msg.rawBody?.asSlice()),
//             tx_hash: tx.hash,
//           };
//         } catch (e) {
//           continue;
//         }
//       } else if (
//         msg.msgType == "ext_out_msg" &&
//         "PigApprovalEvent" &&
//         msg.rawBody
//       ) {
//         try {
//           event = {
//             ...loadPigApprovalEvent(msg.rawBody?.asSlice()),
//             tx_hash: tx.hash,
//           };
//         } catch (e) {
//           continue;
//         }
//       } else if (
//         msg.msgType == "ext_out_msg" &&
//         "WithdrawFromPigEvent" &&
//         msg.rawBody
//       ) {
//         try {
//           event = {
//             ...loadWithdrawFromPigEvent(msg.rawBody?.asSlice()),
//             tx_hash: tx.hash,
//           };
//         } catch (e) {
//           continue;
//         }
//       } else if (
//         msg.msgType == "ext_out_msg" &&
//         "PigCreationEvent" &&
//         msg.rawBody
//       ) {
//         try {
//           event = {
//             ...loadPigCreationEvent(msg.rawBody?.asSlice()),
//             tx_hash: tx.hash,
//           };
//         } catch (e) {
//           continue;
//         }
//       }
//     }
//   }

//   // handle if any purchase related events was found
//   if (event && event.userAddress) {
//     // finding the relative user and its reward receiver
//     let pig_data = await getPigs(event.userAddress.toRawString());
//     let bh: bountyHuntersResponse = await findUsersBountyHunters(
//       event.userAddress.toRawString(),
//       pig_data.new_pig_level
//     );
//     // identifying the event type
//     if (event.$$type == "UpgradePig") {
//       let tx_id = TxId.create(
//         event.userAddress.toRawString(),
//         pig_data.old_pig_level
//       );
//       if (
//         !(await isDuplicatePurchase(
//           event.userAddress.toRawString(),
//           pig_data.old_pig_level
//         ))
//       ) {
//         // the purchase have been initiated and the tokens are received by the "pigsShop" contract
//         console.log(
//           `Upgrade pig request initiated wallet address${event.userAddress}`
//         );

//         // sending the approval message to the pig shop to distribute the tokens to the bounty hunters
//         await sendPigApproval(
//           bh,
//           adminWallet,
//           pigShop,
//           pig_data.address,
//           event.userAddress.toRawString()
//         );

//         // update users transaction history
//         await initTxHistory({
//           tx_id,
//           tx_hash: event.tx_hash,
//           wallet_address: event.userAddress.toRawString(),
//           request_status: "PigUpgradePending",
//           upgraded_pig_level: pig_data.new_pig_level,
//         });
//       }
//     }
//     if (event.$$type == "PigApprovalEvent") {
//       console.log(
//         `approval received for wallet address ${event.userAddress} pig upgrade request`
//       );
//       event.referrer = Dictionary.empty<Address, bigint>().set(
//         event.referrerNftAddress,
//         event.referrerAmount
//       );
//       // the tokens have been distributed, updating the db
//       await updateBountyHuntersBalances({
//         referrer: event.referrer,
//         users: event.userBountyHunters,
//         admins: event.adminsShares,
//       });

//       // the user current pig should be upgraded
//       await upgradeUserPig(event.userAddress.toRawString());

//       // update users transaction history
//       await updateTxHistory({
//         tx_id: TxId.create(
//           event.userAddress.toRawString(),
//           pig_data.old_pig_level
//         ),
//         tx_hash: event.tx_hash,
//         wallet_address: event.userAddress.toRawString(),
//         request_status: "PigPurchaseApproved",
//         upgraded_pig_level: pig_data.new_pig_level,
//       });

//       event.referrer = Dictionary.empty<Address, bigint>().set(
//         event.referrerNftAddress,
//         event.referrerAmount
//       );
//       // update the referrals rewards history
//       let updateRes = await updateReferralsRewardsHistory(event);

//       if (!updateRes) {
//         throw new Error("Failed to update referrals rewards history!");
//       }
//     }
//     if (event.$$type == "PigCreationEvent") {
//       // updating the user pig address on the db
//       await upgradeUserPigAddress(
//         event.userAddress.toRawString(),
//         event.nft.toRawString()
//       );
//     }

//     if (event.$$type === "WithdrawFromPigEvent") {
//       // updating the user pig address on the db
//       await updateUserPiggyBankBalance(
//         event.userAddress.toRawString(),
//         event.nft.toRawString(),
//         event.amount
//       );
//     }
//   }

//   return txs.transactions[txs.transactions.length - 1].lt;
// }

async function catchPigShopEvents(afterLt: bigint) {
  console.log("➡️ Starting to catch PigShop events");
  console.log("🔍 Listen address:", ContractAddresses.pigShop.toString());
  console.log("📌 Last known lt:", afterLt.toString());

  const tc = getTonClient();
  const tac = getTonApiClient();
  const adminWallet = await getAdminWallet(tc);

  console.log("👛 Admin wallet loaded:", adminWallet.address.toString());

  const pigShop = tc.open(PigShop.fromAddress(ContractAddresses.pigShop));

  console.log("🏪 PigShop contract opened at:", pigShop.address.toString());

  const txs = await tac.blockchain.getBlockchainAccountTransactions(
    ContractAddresses.pigShop,
    {
      limit: 10,
    }
  );

  if (txs && txs.transactions.length === 0) {
    console.log("⚠️ No new transactions found");
    return afterLt;
  }
  console.log("📦 Transactions fetched:", txs.transactions.length);

  let event:
    | extendedPigUpgradeEvent
    | extendedPigApprovalEvent
    | extendedPigCreationEvent
    | extendedWithdrawFromPigEvent
    | undefined;

  for (const tx of txs.transactions) {
    console.log("🔁 Processing transaction:", tx.hash);

    if (!tx.computePhase?.success || !tx.actionPhase?.success || tx.aborted) {
      console.log("🚫 Skipped aborted or failed tx:", tx.hash);
      continue;
    }

    if (tx.inMsg?.rawBody === undefined) {
      console.log("⚠️ Skipped tx with no body:", tx.hash);
      continue;
    }

    for (const msg of tx.outMsgs) {
      console.log("💬 Out message:", Object.entries(PigShop.opcodes).find(([key, value]) => BigInt(value) === msg.opCode)?.[0]);

      try {
        if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.UpgradePig) &&
          msg.rawBody
        ) {
          event = {
            ...loadUpgradePig(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          };
          console.log("✅ Detected UpgradePig event");
        } else if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.PigApprovalEvent) &&
          msg.rawBody
        ) {
          event = {
            ...loadPigApprovalEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          };
          console.log("✅ Detected PigApprovalEvent");
        } else if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.WithdrawFromPigEvent) &&
          msg.rawBody
        ) {
          event = {
            ...loadWithdrawFromPigEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          };
          console.log("✅ Detected WithdrawFromPigEvent");
        } else if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.PigCreationEvent) &&
          msg.rawBody
        ) {
          event = {
            ...loadPigCreationEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          };
          console.log("✅ Detected PigCreationEvent");
        }
      } catch (e) {
        console.log("❌ Error decoding message:", msg.decodedOpName, e);
        continue;
      }
    }
  }
  let some = true;
  if (some) {
    return txs.transactions[txs.transactions.length - 1].lt;
  }
  if (event && event.userAddress) {
    console.log("📍 Processing event for user:", event.userAddress.toString());

    const userAddr = event.userAddress.toRawString();
    const pig_data = await getPigs(userAddr);
    console.log("🐷 Pig data loaded:", pig_data);

    const bh = await findUsersBountyHunters(userAddr, pig_data.new_pig_level);
    console.log("🏹 Bounty hunters fetched:", bh);

    if (event.$$type === "UpgradePig") {
      console.log("🛠️ Handling UpgradePig event");

      const tx_id = TxId.create(userAddr, pig_data.old_pig_level);

      const isDup = await isDuplicatePurchase(userAddr, pig_data.old_pig_level);
      console.log("🔁 Is duplicate purchase?", isDup);

      if (!isDup) {
        console.log("🚀 Sending pig approval message");
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
      }
    }

    if (event.$$type === "PigApprovalEvent") {
      console.log("✅ Approval received for:", userAddr);

      event.referrer = Dictionary.empty<Address, bigint>().set(
        event.referrerNftAddress,
        event.referrerAmount
      );

      await updateBountyHuntersBalances({
        referrer: event.referrer,
        users: event.userBountyHunters,
        admins: event.adminsShares,
      });

      await upgradeUserPig(userAddr);

      await updateTxHistory({
        tx_id: TxId.create(userAddr, pig_data.old_pig_level),
        tx_hash: event.tx_hash,
        wallet_address: userAddr,
        request_status: "PigPurchaseApproved",
        upgraded_pig_level: pig_data.new_pig_level,
      });

      const updateRes = await updateReferralsRewardsHistory(event);
      console.log("📦 Referral reward update:", updateRes);

      if (!updateRes)
        throw new Error("Failed to update referrals rewards history!");
    }

    if (event.$$type === "PigCreationEvent") {
      console.log("🐣 Handling PigCreationEvent");

      await upgradeUserPigAddress(userAddr, event.nft.toRawString());
      console.log("✅ User pig address upgraded");
    }

    if (event.$$type === "WithdrawFromPigEvent") {
      console.log("🏧 Handling WithdrawFromPigEvent");

      await updateUserPiggyBankBalance(
        userAddr,
        event.nft.toRawString(),
        event.amount
      );
      console.log("💰 User piggy bank balance updated");
    }
  } else {
    console.log("⚠️ No event with userAddress was detected");
  }

  const nextLt = txs.transactions[txs.transactions.length - 1].lt;
  console.log("⏭️ Returning next lt:", nextLt.toString());

  return nextLt;
}

export async function listenPigShopForever() {
  try {
    let lastLt = BigInt(0);
    // while (true) {
    lastLt = await catchPigShopEvents(lastLt);
    // }
  } catch (error) {
    console.error("Error in listenPigShopForever:", error);
    throw error;
  }
}
