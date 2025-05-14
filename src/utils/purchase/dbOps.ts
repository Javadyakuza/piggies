// call the mint nft function on the contract
import {
  bountyHuntersResponse,
  extendedPigApprovalEvent,
  upgradeUserPigsInternalResponse,
} from "@/models/purchase";
import { supabase } from "../supebase";
import { txHistory } from "@/models/purchase";

// update the db based on the user purchase on the following fields
export const updateBountyHuntersBalances = async (
  bh: bountyHuntersResponse
) => {
  const { data: users, error: fetchUsersError } = await supabase
    .from("users")
    .select("id, pig_balance")
    .in(
      "wallet_address",
      bh.users.keys().map((userAddr) => userAddr.toString())
    );
  if (fetchUsersError) throw fetchUsersError;

  const { data: admins, error: fetchAdminsError } = await supabase
    .from("users")
    .select("pig_balance")
    .in(
      "wallet_address",
      bh.users.keys().map((adminAddr) => adminAddr.toString())
    );

  if (fetchAdminsError) throw fetchAdminsError;

  const usersUpdates = users.map((user) => ({
    id: user.id,
    pig_balance: Number(user.pig_balance ?? 0) + 3,
  }));

  const adminsUpdates = users.map((admin) => ({
    id: admin.id,
    pig_balance: Number(admin.pig_balance ?? 0) + 2,
  }));

  // 3. Send updates in bulk (same `pig_balance` for all is fine)
  const { error: updateError } = await supabase.rpc("batch_update_balances", {
    updates: usersUpdates.concat(adminsUpdates),
  });

  if (updateError) throw updateError;
};

export const upgradeUserPig = async (userAddress: string) => {
  const { data: current_pig, error: userError } = await supabase
    .from("users")
    .select("current_pig")
    .eq("wallet_address", userAddress)
    .single();

  const { error: updateError } = await supabase
    .from("users")
    .update({ current_pig: current_pig?.current_pig ?? 0 + 1 })
    .eq("wallet_address", userAddress);

  if (updateError) {
    console.error("Wallet update error:", updateError);
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
    new_pig_level: current_pig?.current_pig ?? 0 + 1,
  };
};
export const initTxHistory = async (txData: txHistory): Promise<txHistory> => {
  const { data: tx, error: insertError } = await supabase
    .from("txHistory")
    .insert(txData)
    .select()
    .single();

  if (insertError) {
    console.error("Wallet update error:", insertError);
  }
  return tx as txHistory;
};

export const updateTxHistory = async (
  txData: txHistory
): Promise<txHistory> => {
  const { data: tx, error: insertError } = await supabase
    .from("txHistory")
    .update(txData)
    .select()
    .single();

  if (insertError) {
    console.error("Wallet update error:", insertError);
  }
  return tx as txHistory;
};

export async function updateReferralsRewardsHistory(
  event_data: extendedPigApprovalEvent
): Promise<boolean> {
  event_data.userBountyHunters.keys().forEach(async (user) => {
    const { data: tx, error: insertError } = await supabase
      .from("rewardsHistory")
      .insert({
        wallet_address: user.toString(),
        reward: event_data.userBountyHunters.get(user) ?? 3,
        referral: event_data.userAddress.toString(),
        related_tx: event_data.tx_hash,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Update users reward error:", insertError);
    }
  });

  event_data.adminsShares.keys().forEach(async (admin) => {
    const { data: tx, error: insertError } = await supabase
      .from("rewardsHistory")
      .insert({
        wallet_address: admin.toString(),
        reward: event_data.adminsShares.get(admin) ?? 3,
        referral: event_data.userAddress.toString(),
        related_tx: event_data.tx_hash,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Update admins reward error:", insertError);
    }
  });
  return true;
}
