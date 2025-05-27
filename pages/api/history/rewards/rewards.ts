import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import {
  rewardHistory,
  rewardHistoryResponse,
  rewardsHistoryRequest,
  txHistory,
} from "@/models/history";
import { PurchasePigResponse } from "@/models/purchase";

/**
 * @swagger
 * /api/history/rewards/rewards:
 *   get:
 *     summary: Retrieve reward history for a user
 *     description: Fetches the reward history for a user by resolving their wallet address from the provided Telegram ID in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telegram_id:
 *                 type: string
 *                 example: "123456789"
 *     responses:
 *       200:
 *         description: Reward history successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       wallet_address:
 *                         type: string
 *                         example: "0xabc...123"
 *                       reward:
 *                         type: number
 *                         example: 1.5
 *                       referral:
 *                         type: string
 *                         example: "0xdef...456"
 *                       related_tx:
 *                         type: string
 *                         example: "0xghi...789"
 *       400:
 *         description: Invalid or missing Telegram ID in request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid or missing telegram id"
 *       404:
 *         description: Wallet not connected or user not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Wallet is not connected !"
 *       405:
 *         description: Method not allowed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Method not allowed"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "internal server error"
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<rewardHistoryResponse>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { telegram_id } = req.body as rewardsHistoryRequest;

  if (!telegram_id || typeof telegram_id !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or missing telegram id" });
  }

  try {
    // Check if the user exists
    const { data: wallet_address, error: userError } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("telegram_id", telegram_id)
      .single();

    if (userError || !wallet_address) {
      return res
        .status(404)
        .json({ success: false, message: "Wallet is not connected !" });
    }
    const { data: rewards, error } = await supabase
      .from("rewardsHistory")
      .select("wallet_address, reward, referral, related_tx")
      .eq("wallet_address", wallet_address);

    const userData = rewards || [];

    if (error) {
      throw new Error(error.message);
    }

    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, message: userData });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
}
