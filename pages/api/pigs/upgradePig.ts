import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { handlePigPurchase } from "@/utils/purchase/purchaseHandler";
import {
  PurchasePigRequest,
  PurchasePigResponse,
} from "@/models/purchaseModels";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PurchasePigResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { telegram_id, wallet_address } = req.body as PurchasePigRequest;

  if (!telegram_id || !wallet_address) {
    return res.status(400).json({
      success: false,
      message: "telegram_id or wallet_address is required",
    });
  }

  // Check if the user exists
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, current_pig, wallet_address")
    .eq("telegram_id", telegram_id)
    .single();

  if (userError || !user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.wallet_address !== wallet_address) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid wallet address" });
  }

  if (user.current_pig === 4) {
    return res.status(400).json({
      success: false,
      message: "Pig level already maxed out",
    });
  }
  // starting the event listener by the wallet address

  try {
    let purchaseResponse: PurchasePigResponse = await handlePigPurchase(
      wallet_address,
      user.current_pig
    );
    return res.status(200).json(purchaseResponse);
  } catch (error) {
    console.error("Error handling pig purchase:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to update pig value, message ${error}`,
    });
  }

  return res.status(500).json({
    success: false,
    message: `Failed to update pig value, message`,
  });
}
