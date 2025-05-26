import { toNano } from "@ton/ton";

import { supabase } from "@/utils/supebase";
import { PurchasePigResponse, UpgradePigParams } from "@/models/purchase";
import { calculatePigPrice } from "@/utils/purchase/pigPrice";

// export async function sendUpgradePig(
//   pigShop: OpenedContract<PigShop>,
//   wallet: OpenedContract<WalletContractV5R1>
// ) {
//   let secretKey = (await keyPairFromEnv()).secretKey;

//   await pigShop.send(
//     wallet.sender(secretKey),
//     {
//       value: toNano("0.1"),
//     },

//     "UpgradePig"
//   );
// }

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

    console.log("contract_address ", process.env.NEXT_PUBLIC_PIGSHOP_ADDRESS);

    const tx_fee = toNano("0.5");

    const params: UpgradePigParams = {
      amount: tx_fee + PigCost,
      operation: "UpgradePig",
    };
    console.log("create transaction", params);
    return { success: true, message: params };
  } catch (error) {
    console.log("Error fetching user:", error);
    return { success: false, message: String(error) };
  }
}
