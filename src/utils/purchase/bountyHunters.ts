import { supabase } from "@/utils/supebase";
import { User } from "@/models/userTree";
import { bountyHuntersResponse } from "@/models/purchase";
import { Address, Dictionary, toNano } from "@ton/core";
import { PigLevel } from "@/models/pigs";
import { pigsMapV2 } from "../pigs_map";

export async function findUsersBountyHunters(
  walletAddress: string,
  upgradedPigLevel: PigLevel
): Promise<bountyHuntersResponse> {
  try {
    if (upgradedPigLevel === 0) {
      throw new Error("upgradedPigLevel must be greater than 0");
    }

    // ----------------------------------------------------
    // Step 1: Fetch the user it self
    // ----------------------------------------------------

    const { data: user, error: tgIdError } = await supabase
      .from("users")
      .select()
      .eq("wallet_address", walletAddress)
      .single();

    if (tgIdError || !user) {
      throw new Error("User not found via Addr");
    }

    // ----------------------------------------------------
    // Step 2: Fetch the user referrer
    // ----------------------------------------------------
    const { data: referrer, error: referrerError } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("id", user.inviter_id)
      .single();

    if (referrerError || !referrer) {
      throw new Error("referrer not found via user.inviter_id");
    }

    //----------------------------------------------------
    const upperUsers: User[] = [];
    const admins: User[] = [];
    const userIdsToFetch: string[] = [];
    const upperUsersLimit = upgradedPigLevel === 1 ? 3 : 12;

    let currentUserId: string | null = user.id;
    //----------------------------------------------------

    // ----------------------------------------------------
    // Step 3: Fetching the upper users
    // ----------------------------------------------------
    for (let i = 0; i < upperUsersLimit; i++) {
      if (!currentUserId) break;

      const { data: parent, error: parentError } = await supabase
        .from("users")
        .select("id, parent_id")
        .eq("id", currentUserId)
        .single();

      if (parentError || !parent || !parent.parent_id || parent.parent_id < 0)
        break;

      userIdsToFetch.push(parent.parent_id);
      currentUserId = parent.parent_id;
    }

    // ----------------------------------------------------
    // Step 4: Fetching the upper users details and checking the eligibility
    // ----------------------------------------------------
    if (userIdsToFetch.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select(
          "id, telegram_id, wallet_address, current_pig, fullname, inviter_id, user_type"
        )
        .in("id", userIdsToFetch);

      if (usersError || !users) {
        throw new Error("Failed to fetch upper users: " + usersError?.message);
      }

      for (const user of users) {
        const totalInvited = await calcTotalInvited(user.id);
        if (user.current_pig <= upgradedPigLevel) {
          upperUsers.push({
            telegram_id: user.telegram_id,
            wallet_address: user.wallet_address || "",
            current_pig: user.current_pig ?? 0,
            fullname: user.fullname || "",
            inviter_id: user.inviter_id || "",
            total_invited: totalInvited,
            user_type: user.user_type,
          });
        }
      }
    }

    // ----------------------------------------------------
    // Step 4: Fetching the admins
    // ----------------------------------------------------
    const { data: wholeAdmins, error: usersError } = await supabase
      .from("users")
      .select(
        "id, telegram_id, wallet_address, current_pig, fullname, inviter_id, user_type"
      )
      .eq("user_type", 0);

    if (!wholeAdmins) {
      throw new Error("No Admins found");
    }

    for (const admin of wholeAdmins) {
      admins.push({
        ...admin,
        total_invited: await calcTotalInvited(admin.id),
      });
    }


    // ----------------------------------------------------
    // Step 5: Updating the upper users, admins and the referrer shares
    // ----------------------------------------------------

    let usersDic = Dictionary.empty<Address, bigint>();
    let adminsDic = Dictionary.empty<Address, bigint>();
    let referrerDic = Dictionary.empty<Address, bigint>();
    const pigCostInTon = pigsMapV2(undefined, 1)[upgradedPigLevel - 1]
      .rawPriceInTon;

    upperUsers.map((user) => {
      return usersDic.set(
        Address.parse(user.wallet_address),
        BigInt(toNano(calcShares("user", upgradedPigLevel, pigCostInTon)))
      );
    });
    admins.map((admin) => {
      adminsDic.set(
        Address.parse(admin.wallet_address),
        BigInt(toNano(calcShares("admin", upgradedPigLevel, pigCostInTon)))
      );
    });
    console.log(adminsDic);
    referrerDic.set(
      Address.parse(referrer.wallet_address),
      BigInt(toNano(calcShares("referrer", upgradedPigLevel, pigCostInTon)))
    );

    // ----------------------------------------------------
    // Step 6: Calc if any money is left to assign to the admin
    // ----------------------------------------------------
    let totalPayments = referrerDic
      .values()
      .concat(usersDic.values())
      .concat(adminsDic.values());
    let totalPaymentsSum = totalPayments.reduce((a, b) => a + b, BigInt(0));
    console.log("totalPaymentsSum", totalPaymentsSum);
    let change = BigInt(toNano(pigCostInTon)) - totalPaymentsSum;
    if (change > BigInt(0)) {
      const eachAdminShare = change / BigInt(adminsDic.keys().length);
      console.log("eachAdminShare", eachAdminShare);
      for (const key of adminsDic.keys()) {
        const currentValue = adminsDic.get(key) || BigInt(0);
        console.log("currentValue", currentValue);
        adminsDic.set(key, currentValue + eachAdminShare);
      }
    }
    return {
      referrer: referrerDic,
      users: usersDic,
      admins: adminsDic,
    };
  } catch (error) {
    throw new Error(`Error fetching upper users and admins${error}`);
  }
}

async function calcTotalInvited(userId: string): Promise<number> {
  try {
    const totalInvited =
      (await supabase.from("users").select("id").eq("inviter_id", userId)).data
        ?.length || 0;

    return totalInvited;
  } catch (error) {
    throw new Error(`Error calculating total invited ${userId}`);
  }
}

function calcShares(
  role: "admin" | "user" | "referrer",
  upgradedPigLevel: PigLevel,
  pigCostInTon: number
): number {
  const userSharePercentage = upgradedPigLevel === 1 ? 20 : 5;
  switch (role) {
    case "admin":
      return (pigCostInTon * 20) / 100;
    case "referrer":
      return (pigCostInTon * 20) / 100;
    case "user":
      return (pigCostInTon * userSharePercentage) / 100;
    default:
      return 0;
  }
}
