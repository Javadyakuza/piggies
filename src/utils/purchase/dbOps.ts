// call the mint nft function on the contract
import {
  bountyHuntersResponse,
  extendedPigApprovalEvent,
  upgradeUserPigsInternalResponse,
} from "@/models/purchase";
import { supabase } from "../supebase";
import { txHistory, TxId } from "@/models/history";
import { PigLevel } from "@/models/pigs";
import { Address, fromNano } from "@ton/core";
import { findOpenSlotInSubtree } from "../tree";

// update the db based on the user purchase on the following fields
export const updateBountyHuntersBalances = async (
  bounty_hunters: bountyHuntersResponse
) => {
  let bh = bounty_hunters;
  //----------------------------------------------------
  // Step 1: Fetch the user stats (previous piggy bank balance)
  //----------------------------------------------------
  const { data: users, error: fetchUsersError } = await supabase
    .from("users")
    .select("wallet_address, piggy_bank_balance")
    .in(
      "wallet_address",
      bh.users.keys().map((userAddr) => userAddr.toRawString())
    );
  if (fetchUsersError) throw fetchUsersError;

  const { data: admins, error: fetchAdminsError } = await supabase
    .from("users")
    .select("wallet_address, piggy_bank_balance")
    .in(
      "wallet_address",
      bh.admins.keys().map((adminAddr) => adminAddr.toRawString())
    );

  if (fetchAdminsError) throw fetchAdminsError;

  const { data: referrer, error: fetchReferrerError } = await supabase
    .from("users")
    .select("wallet_address, piggy_bank_balance")
    .in(
      "wallet_address",
      bh.referrer.keys().map((referrerAddr) => referrerAddr.toRawString())
    );

  if (fetchReferrerError) throw fetchReferrerError;

  //----------------------------------------------------
  // Step 2: updating the user balances to update the db
  //----------------------------------------------------

  users.forEach((user) =>
    bh.users.set(
      Address.parse(user.wallet_address),
      BigInt(user.piggy_bank_balance) +
        bh.users.get(Address.parse(user.wallet_address))!
    )
  );

  admins.forEach((admin) =>
    bh.admins.set(
      Address.parse(admin.wallet_address),
      BigInt(admin.piggy_bank_balance) +
        bh.admins.get(Address.parse(admin.wallet_address))!
    )
  );

  referrer.forEach((referrer) =>
    bh.referrer.set(
      Address.parse(referrer.wallet_address),
      BigInt(referrer.piggy_bank_balance) +
        bh.referrer.get(Address.parse(referrer.wallet_address))!
    )
  );

  //----------------------------------------------------
  // Step 3: updating the user balances on the DB
  //----------------------------------------------------

  for (const userAddr of bh.users.keys()) {
    const { error } = await supabase
      .from("users")
      .update({ piggy_bank_balance: Number(bh.users.get(userAddr)) })
      .eq("wallet_address", userAddr.toRawString());

    if (error) {
      console.error(`Failed to update user ${userAddr.toRawString()}:`, error);
      throw new Error(
        `Failed to update user ${userAddr.toRawString()}: ${error}`
      );
    }
  }

  for (const adminAddr of bh.admins.keys()) {
    const { error } = await supabase
      .from("users")
      .update({ piggy_bank_balance: Number(bh.admins.get(adminAddr)) })
      .eq("wallet_address", adminAddr.toRawString());

    if (error) {
      console.error(
        `Failed to update admin ${adminAddr.toRawString()}:`,
        error
      );
      throw new Error(
        `Failed to update admin ${adminAddr.toRawString()}: ${error}`
      );
    }
  }

  for (const referrerAddr of bh.referrer.keys()) {
    const { error } = await supabase
      .from("users")
      .update({ piggy_bank_balance: Number(bh.referrer.get(referrerAddr)) })
      .eq("wallet_address", referrerAddr.toRawString());

    if (error) {
      console.error(
        `Failed to update referrer ${referrerAddr.toRawString()}:`,
        error
      );
      throw new Error(
        `Failed to update referrer ${referrerAddr.toRawString()}: ${error}`
      );
    }
  }
};

export const upgradeUserPig = async (userAddress: string) => {
  const { data, error: pigError } = await supabase
    .from("users")
    .select("current_pig")
    .eq("wallet_address", userAddress)
    .single();

  if (pigError || !data) {
    throw new Error(`Failed to fetch user ${userAddress}: ${pigError.message}`);
    return;
  }

  let currentPig = Number(data.current_pig ?? 0);

  // Cap at 4
  if (currentPig >= 4) {
    console.log(`User ${userAddress} is already at max pig level.`);
    return;
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ current_pig: currentPig + 1 })
    .eq("wallet_address", userAddress);

  if (updateError) {
    throw new Error(`Wallet update error: ${updateError.message}`);
  }

  // updating the user parent id in the tree if he just updated to the bronze pig
  if (currentPig === 0) {
    await UpdateUSerInTree(userAddress, "");
  }
};

export const upgradeUserPigAddress = async (
  wallet_address: string,
  pig_address: string
) => {
  const { error: updateError } = await supabase
    .from("users")
    .update({ pig_address })
    .eq("wallet_address", wallet_address);

  if (updateError) {
    throw new Error(`Wallet update error: ${updateError.message}`);
  }
};


export const getPigs = async (
  userAddress: string
): Promise<upgradeUserPigsInternalResponse> => {
  const { data: current_pig, error: userError } = await supabase
    .from("users")
    .select("current_pig, pig_address")
    .eq("wallet_address", userAddress)
    .single();

  return {
    old_pig_level: current_pig?.current_pig ?? 0,
    new_pig_level: (current_pig?.current_pig ?? 0) + 1,
    address: Address.parse(current_pig?.current_pig) || null,
  };
};

export const initTxHistory = async (txData: txHistory): Promise<txHistory> => {
  const { data: tx, error: insertError } = await supabase
    .from("tx_history")
    .insert(txData)
    .select()
    .single();

  if (insertError) {
    throw new Error(
      `Wallet update error (initTxHistory): ${insertError.message}`
    );
  }
  return tx as txHistory;
};

export const updateTxHistory = async (
  txData: txHistory
): Promise<txHistory> => {
  const { data: tx, error: insertError } = await supabase
    .from("tx_history")
    .update(txData)
    .eq("tx_hash", txData.tx_hash)
    .select()
    .single();

  if (insertError) {
    throw new Error(
      `Wallet update error(updateTxHistory): ${insertError.message}`
    );
  }
  return tx as txHistory;
};

export async function updateReferralsRewardsHistory(
  event_data: extendedPigApprovalEvent
): Promise<boolean> {
  for (const user of Array.from(event_data.userBountyHunters.keys())) {
    const reward = event_data.userBountyHunters.get(user);
    const { error: insertError } = await supabase
      .from("rewards_history")
      .insert({
        wallet_address: user.toRawString(),
        reward: Number(reward),
        referral: event_data.userAddress.toRawString(),
        related_tx: event_data.tx_hash,
      })
      .select()
      .single();

    console.log(
      `rewarded user ${user.toRawString()} with ${Number(fromNano(reward!))} TON`
    );

    if (insertError) {
      throw new Error(`Update users reward error: ${insertError.message}`);
    }
  }

  for (const admin of Array.from(event_data.adminsShares.keys())) {
    const reward = event_data.adminsShares.get(admin);
    const { error: insertError } = await supabase
      .from("rewards_history")
      .insert({
        wallet_address: admin.toRawString(),
        reward: Number(reward),
        referral: event_data.userAddress.toRawString(),
        related_tx: event_data.tx_hash,
      })
      .select()
      .single();

    console.log(
      `rewarded admin ${admin.toRawString()} with ${Number(fromNano(reward!))} TON`
    );

    if (insertError) {
      console.error("Update admins reward error:", insertError);
    }
  }

  if (event_data.referrer) {
    for (const referrer of Array.from(event_data.referrer.keys())) {
      const reward = event_data.referrer.get(referrer);
      const { error: insertError } = await supabase
        .from("rewards_history")
        .insert({
          wallet_address: referrer.toRawString(),
          reward: Number(reward),
          referral: event_data.userAddress.toRawString(),
          related_tx: event_data.tx_hash,
        })
        .select()
        .single();

      console.log(
        `rewarded referrer ${referrer.toRawString()} with ${Number(fromNano(reward!))} TON`
      );

      if (insertError) {
        throw new Error(`Update referrer reward error: ${insertError.message}`);
      }
    }
  }

  return true;
}

export async function isDuplicatePurchase(
  userAddress: string,
  pigLevel: PigLevel
): Promise<boolean> {
  let tx_id = TxId.create(userAddress, pigLevel);
  const { data: req, error: fetchError } = await supabase
    .from("tx_history")
    .select("request_status")
    .eq("tx_id", tx_id)
    .single();

  if (fetchError) {
    throw new Error(`Error fetching tx history: ${fetchError.message}`);
  }
  if (req?.request_status && req.request_status === "PigPurchaseApproved") {
    return true;
  } else if (
    req?.request_status &&
    req.request_status === "PigUpgradePending"
  ) {
    return true;
  }

  return false;
}

export async function UpdateUSerInTree(
  wallet_address: string,
  parent_id: string
) {
  const { error: updateError } = await supabase
    .from("users")
    .update({ parent_id: parent_id })
    .eq("wallet_address", wallet_address);

  if (updateError) {
    throw new Error(
      `Update user parent_id error (updateUserInTree): ${updateError.message}`
    );
  }
}

export async function getParentId(
  wallet_address: string,
  referral_id?: string
): Promise<{ pi: string; ii: string }> {
  //----------------------------------------------------
  // Step 1: getting the user, its inviter and the genesis account
  //----------------------------------------------------

  const { data: genesisUser } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", "@genesis")
    .single();

  if (!genesisUser) {
    throw new Error("couldn't fetch the genesis account");
  }

  let inviter_id: string | null = null;

  if (wallet_address) {
    const { data: inviter } = await supabase
      .from("users")
      .select("inviter_id")
      .eq("wallet_address", wallet_address)
      .single();

    if (!inviter) {
      throw new Error("couldn't fetch the inviter_id account");
    }

    inviter_id = inviter.inviter_id;
  } else if (referral_id) {
    const { data: inviter } = await supabase
      .from("users")
      .select("id")
      .eq("referral_id", referral_id)
      .single();

    if (!inviter) {
      throw new Error("couldn't fetch the inviter_id account");
    }
    inviter_id = inviter.id;
  }

  //----------------------------------------------------
  // Step 2: Fetching the parent_id
  //----------------------------------------------------
  let parentId: string | number | null = null;

  if (inviter_id) {
    // Find an open slot in inviter's subtree for the new user
    parentId = await findOpenSlotInSubtree(String(inviter_id));
    if (!parentId) {
      // If for some reason no slot found (tree completely full), default to attaching to inviter
      parentId = await findOpenSlotInSubtree(String(genesisUser.id));
    }
  } else {
    parentId = await findOpenSlotInSubtree(String(genesisUser.id));
    inviter_id = genesisUser.id;
  }

  return { pi: String(parentId), ii: String(inviter_id) };
}
