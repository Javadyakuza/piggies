import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { handlePigPurchase } from "@/utils/purchase/purchaseHandler";
import {
  PurchasePigRequest,
  PurchasePigResponse,
  UpgradePigParams,
} from "@/models/purchase";
import { mockPigPurchase } from "@/utils/purchase/mocker";
// import { calculatePigPrice } from "@/utils/purchase/pigPrice";
import { toNano } from "@ton/ton";
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
      .select("wallet_address, current_pig")
      .eq("wallet_address", wallet_address)
      .single();

    if (userError || !user.wallet_address) {
      return res
        .status(404)
        .json({ success: false, message: "no wallets ?!#$" });
    }

    const PigCost = BigInt(
      toNano(pigsMapV2(undefined, 1)[user.current_pig].rawPriceInTon)
    );

    const tx_fee = toNano("0.5");

    const params: UpgradePigParams = {
      amount: (tx_fee + PigCost).toString(),
      operation: "UpgradePig",
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
