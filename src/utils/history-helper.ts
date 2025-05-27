import { ReferralResponse, User } from "@/models/userTree";
import { countReferralsByLevel } from "../../pages/api/user-tree/referrals";
import { supabase } from "./supebase";
import { error } from "console";
import { PigLevel } from "@/models/pigs";

export async function getUser(wallet_address: string) {
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select()
    .eq("wallet_address", wallet_address)
    .single();

  if (fetchError) {
    console.error("Error fetching user:", fetchError);
  }
  return user;
}

export async function findDepth(wallet_address: string): Promise<number> {
  let user = await getUser(wallet_address);

  const referralNum = parseInt("10", 10);

  let referralLevels = await countReferralsByLevel(user.id);

  let response: ReferralResponse = {};
  let totalUnder = 0;

  // Loop through levels based on referralsNum
  for (let i = 0; i < referralNum; i++) {
    const level = referralLevels[i];
    response[`level_${i + 1}`] = {
      count: level.count,
      total: level.total,
      users: level.users,
    };
    totalUnder += level.count;
  }

  for (const [key, value] of Object.entries(response)) {
    if (typeof value === "object" && "users" in value) {
      const level = parseInt(key);
      const userFound = value.users.find(
        (user) => user.wallet_address === wallet_address
      );
      if (userFound) {
        return level;
      }
    }
  }
  throw new Error("User not found");
}

export async function getUpgradedPigLevel(tx_hash: string): Promise<number> {
  const { data: user, error: fetchError } = await supabase
    .from("txHistory")
    .select("upgraded_pig_level")
    .eq("tx_hash", tx_hash)
    .single();

  if (fetchError) {
    console.error("Error fetching user:", fetchError);
  }
  return user?.upgraded_pig_level || 0;
}

export async function prepareUserHistoryObj(tx: any): Promise<any> {
  if (tx["reward"]) {
    return {
      created_at: tx.created_at,
      fullname: (await getUser(tx.wallet_address)).fullname,
      upgraded_pig_level: (await getUpgradedPigLevel(
        tx.related_tx
      )) as PigLevel,
      self_balance_change: tx.reward,
      referral_depth: await findDepth(tx.wallet_address),
    };
  } else {
    return {
      created_at: tx.created_at,
      fullname: (await getUser(tx.wallet_address)).fullname,
      upgraded_pig_level: tx.upgradedPigLevel,
      self_balance_change: 0,
      referral_depth: 0,
    };
  }
}
