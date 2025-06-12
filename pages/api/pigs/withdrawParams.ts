import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { handlePigPurchase } from "@/utils/purchase/purchaseHandler";
import {
  PurchasePigRequest,
  PurchasePigResponse,
  UpgradePigParams,
  WithdrawPigParams,
} from "@/models/purchase";
import { mockPigPurchase } from "@/utils/purchase/mocker";
// import { calculatePigPrice } from "@/utils/purchase/pigPrice";
import { Address, toNano } from "@ton/ton";
import { pigsMapV2 } from "@/utils/pigs_map";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PurchasePigResponse>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { wallet_address } = req.query;

  try {
    // Check if the user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("wallet_address, pig_address, piggy_bank_balance")
      .eq("wallet_address", wallet_address)
      .single();

    console.log(user);
  if (userError || !user.wallet_address || !user.pig_address) {
  return res.status(404).json({
    success: false,
    message: "Wallet or pig address not found.",
  });
}

    const tx_fee = toNano("0.5");

    const params: WithdrawPigParams = {
      amount: tx_fee.toString(),
      pig_address: user.pig_address,
      operation: "WithdrawFromNftPig",
      balance: user.piggy_bank_balance,
    };

    const response = {
      success: true,
      message: params,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error handling pig purchase:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to update pig value, message ${error}`,
    });
  }
}
