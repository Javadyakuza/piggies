import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";
import {
  rewardHistoryResponse,
  txHistory,
  txRewardHistoryRequest,
} from "@/models/history";
import { PurchasePigResponse } from "@/models/purchase";

/**
 * @swagger
 * /api/history/rewards/txRewards:
 *   post:
 *     summary: Retrieve specific reward history by Telegram ID and transaction hash
 *     description: Resolves the wallet address from the provided Telegram ID and fetches reward history entries matching the given transaction hash.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telegram_id
 *               - tx_hash
 *             properties:
 *               telegram_id:
 *                 type: string
 *                 description: The Telegram ID of the user
 *                 example: "123456789"
 *               tx_hash:
 *                 type: string
 *                 description: Transaction hash to filter reward history
 *                 example: "0xabc123def456"
 *     responses:
 *       200:
 *         description: Matching reward history successfully retrieved.
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
 *                         example: 3.5
 *                       referral:
 *                         type: string
 *                         example: "0xdef...789"
 *                       related_tx:
 *                         type: string
 *                         example: "0xghi...456"
 *       400:
 *         description: Missing or invalid Telegram ID.
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
 *         description: Wallet not connected or user data not found.
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
 *         description: Internal server error during request.
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

  const { telegram_id, tx_hash } = req.body as txRewardHistoryRequest;

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
    const { data: tx, error } = await supabase
      .from("rewards_history")
      .select("wallet_address, reward, referral, related_tx")
      .eq("related_tx", tx_hash);

    const userData = tx || [];

    if (error) {
      throw new Error(error.message);
    }

    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: false, message: userData });
  } catch (error) {
    console.error("Error fetching user(history/user):", error);
    return res
      .status(500)
      .json({ success: false, message: `internal server error ${error}` });
  }
}
