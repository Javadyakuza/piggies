import { toNano } from "@ton/ton";

import { supabase } from "@/utils/supebase";
import { PurchasePigResponse, UpgradePigParams } from "@/models/purchase";
import { calculatePigPrice } from "@/utils/purchase/pigPrice";

export async function getUpgradePigParams(
  wallet_address: string
): Promise<PurchasePigResponse> {
  try {
    // Check if the user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("wallet_address, current_pig")
      .eq("wallet_address", wallet_address)
      .single();

    if (userError || !user.wallet_address) {
      return { success: false, message: "no wallets ?!#$" };
    }

    const PigCost = await calculatePigPrice(user.current_pig + 1);

    const tx_fee = toNano("0.5");

    const params: UpgradePigParams = {
      amount: tx_fee + PigCost,
      operation: "UpgradePig",
    };
    return { success: true, message: params };
  } catch (error) {
    console.log("Error fetching user(get upgrade pig params):", error);
    return { success: false, message: String(error) };
  }
}
