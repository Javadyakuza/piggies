// call the mint nft function on the contract
import {
  bountyHuntersResponse,
  extendedPigApprovalEvent,
  upgradeUserPigsInternalResponse,
} from "@/models/purchase";
import { supabase } from "../supebase";
import { txHistory, TxId } from "@/models/history";
import { PigLevel } from "@/models/pigs";

// update the db based on the user purchase on the following fields
export const updateBountyHuntersBalances = async (
  bh: bountyHuntersResponse
) => {
  const { data: users, error: fetchUsersError } = await supabase
    .from("users")
    .select("id, piggy_bank_balance")
    .in(
      "wallet_address",
      bh.users.keys().map((userAddr) => userAddr.toRawString())
    );
  if (fetchUsersError) throw fetchUsersError;

  const { data: admins, error: fetchAdminsError } = await supabase
    .from("users")
    .select("id, piggy_bank_balance")
    .in(
      "wallet_address",
      bh.users.keys().map((adminAddr) => adminAddr.toRawString())
    );

  if (fetchAdminsError) throw fetchAdminsError;

  const usersUpdates = users.map((user) => ({
    id: user.id,
    pig_balance: Number(user.piggy_bank_balance ?? 0) + 3,
  }));

  const adminsUpdates = admins.map((admin) => ({
    id: admin.id,
    pig_balance: Number(admin.piggy_bank_balance ?? 0) + 2,
  }));

  // 3. Send updates in bulk (same `pig_balance` for all is fine)
  for (const update of usersUpdates.concat(adminsUpdates)) {
    const { error } = await supabase
      .from("users")
      .update({ piggy_bank_balance: update.pig_balance })
      .eq("id", update.id);

    if (error) {
      console.error(`Failed to update user ${update.id}:`, error);
      throw new Error(`Failed to update user ${update.id}: ${error}`);
      // You can choose to continue or stop here
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
    throw new Error(`Failed to fetch user ${userAddress}: ${pigError}`);
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
    throw new Error(`Wallet update error: ${updateError}`);
  }
};

export const getPigs = async (
  userAddress: string
): Promise<upgradeUserPigsInternalResponse> => {
  const { data: current_pig, error: userError } = await supabase
    .from("users")
    .select("current_pig")
    .eq("wallet_address", userAddress)
    .single();

  return {
    old_pig_level: current_pig?.current_pig ?? 0,
    new_pig_level: (current_pig?.current_pig ?? 0) + 1,
  };
};

export const initTxHistory = async (txData: txHistory): Promise<txHistory> => {
  const { data: tx, error: insertError } = await supabase
    .from("tx_history")
    .insert(txData)
    .select()
    .single();

  if (insertError) {
    throw new Error(`Wallet update error (initTxHistory): ${insertError}`);
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
    throw new Error(`Wallet update error(updateTxHistory): ${insertError}`);
  }
  return tx as txHistory;
};

export async function updateReferralsRewardsHistory(
  event_data: extendedPigApprovalEvent
): Promise<boolean> {
  event_data.userBountyHunters.keys().forEach(async (user) => {
    const { data: tx, error: insertError } = await supabase
      .from("rewards_history")
      .insert({
        wallet_address: user.toRawString(),
        reward: Number(event_data.userBountyHunters.get(user)) ?? 3,
        referral: event_data.userAddress.toRawString(),
        related_tx: event_data.tx_hash,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Update users reward error: ${insertError}`);
    }
  });

  event_data.adminsShares.keys().forEach(async (admin) => {
    const { data: tx, error: insertError } = await supabase
      .from("rewards_history")
      .insert({
        wallet_address: admin.toRawString(),
        reward: Number(event_data.adminsShares.get(admin)) ?? 2,
        referral: event_data.userAddress.toRawString(),
        related_tx: event_data.tx_hash,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Update admins reward error: ${insertError}`);
    }
  });
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
    throw new Error(`Error fetching tx history: ${fetchError}`);
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
