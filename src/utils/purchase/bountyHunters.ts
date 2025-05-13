import { supabase } from "@/utils/supebase";
import { User } from "@/models/userTreeModels";
import { bountyHuntersResponse } from "@/models/purchaseModels";
import { Address, Dictionary } from "@ton/core";

export async function findUsersBountyHunters(
  walletAddress: string
): Promise<bountyHuntersResponse> {
  try {
    // Step 1: Fetch the user by telegramId to get their ID
    const { data: telegramId, error: tgIdError } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("wallet_address", walletAddress)
      .single();

    if (tgIdError || !telegramId) {
      throw new Error("User not found");
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, parent_id")
      .eq("telegram_id", telegramId)
      .single();

    if (userError || !user) {
      throw new Error("User not found");
    }

    const upperUsers: User[] = [];
    const admins: User[] = [];
    let currentUserId: string | null = user.id;
    const userIdsToFetch: string[] = [];

    // Step 2: Traverse up to three levels by following parent_id
    for (let i = 0; i < 3; i++) {
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

    // Step 3: Fetch details of the upper users
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

      // Step 4: Calculate total_invited for each user and format the response
      for (const user of users) {
        const totalInvited = await calcTotalInvited(user.id);

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
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(
        "id, telegram_id, wallet_address, current_pig, fullname, inviter_id, user_type"
      )
      .eq("user_type", 0);

    if (!users) {
      console.error("No Admins found");
      throw new Error("No Admins found");
    }
    // Return the upper users in the order they were found (closest to furthest)
    for (let user of users) {
      admins.push({ ...user, total_invited: await calcTotalInvited(user.id) });
    }
    let usersDic = Dictionary.empty<Address, bigint>();
    let adminsDic = Dictionary.empty<Address, bigint>();
    upperUsers.map((user) =>
      usersDic.set(Address.parse(user.wallet_address), BigInt(3))
    );
    admins.map((admin) =>
      adminsDic.set(Address.parse(admin.wallet_address), BigInt(2))
    );
    return {
      users: usersDic,
      admins: adminsDic,
    };
  } catch (error) {
    console.error("Error fetching upper users and admins:", error);
    throw new Error(`Error fetching upper users and admins${error}`);
  }
}

async function calcTotalInvited(userId: string): Promise<number> {
  try {
    const totalInvited =
      (await supabase.from("users").select("id").eq("inviter_id", userId)).data
        ?.length || 0;
    if (!totalInvited) {
      console.error("how can he earn rewards without invited people ???!!!");
      throw new Error(`No invites found ${userId}`);
    }
    return totalInvited;
  } catch (error) {
    console.error("Error calculating total invited:", error);
    throw new Error(`Error calculating total invited ${userId}`);
  }
}
