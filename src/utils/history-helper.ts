import { ReferralResponse, User } from "@/models/userTree";
import { countReferralsByLevel } from "../../pages/api/user-tree/referrals";
import { supabase } from "./supebase";
import { error } from "console";
import { PigLevel } from "@/models/pigs";

export async function getUser(wallet_address: string) {
  const { data, error: fetchError } = await supabase
    .from("users")
    .select("id, wallet_address, fullname")
    .eq("wallet_address", wallet_address.trim().toLowerCase())
    .single();

  if (fetchError) {
    throw new Error(
      `Error fetching user(getUser):
      ${fetchError.message}
      ${wallet_address.trim().toLowerCase()}`
    );
  }

  return data!;
}

export async function findDepth(
  upper_user: string,
  wallet_address: string
): Promise<number> {
  let user = await getUser(upper_user);

  if (!user?.wallet_address) {
    throw new Error("Invalid upper_user (no wallet address)");
  }

  const referralNum = parseInt("10", 10);

  let referralLevels = await countReferralsByLevel(user.wallet_address);

  let response: ReferralResponse = {};
  let totalUnder = 0;

  for (let i = 0; i < referralNum; i++) {
    const level = referralLevels[i];
    if (!level) {
      console.warn(`⚠️ Level ${i + 1} is undefined.`);
      continue;
    }

    response[`level_${i + 1}`] = {
      count: level.count,
      total: level.total,
      users: level.users,
    };
    totalUnder += level.count;
  }

  for (const [key, value] of Object.entries(response)) {
    if (typeof value === "object" && "users" in value) {
      const userFound = value.users.find(
        (user) => user.wallet_address === wallet_address
      );

      if (userFound) {
        const levelScore = levelsMap(value.total);
        return levelScore;
      }
    }
  }

  throw new Error("User not found in referral tree.");
}

export async function getUpgradedPigLevel(tx_hash: string): Promise<number> {
  const { data: user, error: fetchError } = await supabase
    .from("tx_history")
    .select("upgraded_pig_level")
    .eq("tx_hash", tx_hash)
    .single();

  if (fetchError) {
    throw new Error(
      `Error fetching user (getUpgradedPigLevel):
      ${fetchError.message}`
    );
  }
  return user?.upgraded_pig_level || 0;
}

export async function prepareUserHistoryObj(tx: any): Promise<any> {
  console.log("tx in pre", tx);
  if (tx.reward) {
    console.log("tx.referral", tx.referral);
    return {
      created_at: tx.created_at,
      fullname: (await getUser(tx.referral)).fullname,
      upgraded_pig_level: (await getUpgradedPigLevel(
        tx.related_tx
      )) as PigLevel,
      self_balance_change: tx.reward,
      referral_depth: await findDepth(tx.wallet_address, tx.referral),
    };
  } else {
    return {
      created_at: tx.created_at,
      fullname: (await getUser(tx.wallet_address)).fullname,
      upgraded_pig_level: tx.upgraded_pig_level,
      self_balance_change: 0,
      referral_depth: 0,
    };
  }
}

const levelsMap = (level: number) => {
  switch (level) {
    case 3:
      return 1;
    case 9:
      return 2;
    case 27:
      return 3;
    case 81:
      return 4;
    case 243:
      return 5;
    case 729:
      return 6;
    case 2187:
      return 7;
    case 6561:
      return 8;
    case 19683:
      return 9;
    case 59049:
      return 10;
    case 177147:
      return 11;
    default:
      return 0;
  }
};
