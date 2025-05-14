import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { rewardHistoryResponse, txHistory, txRewardHistoryRequest } from "@/models/history";
import { PurchasePigResponse } from "@/models/purchase";

/**
 * @swagger
 * /api/user-tree/{telegram_id}:
 *   get:
 *     summary: Retrieve transaction history for a user by Telegram ID
 *     description: Fetches the transaction history data for a user by first resolving their wallet address from the Telegram ID, then querying the txHistory table.
 *     parameters:
 *       - name: telegram_id
 *         in: path
 *         description: The Telegram ID of the user whose transaction history is being requested.
 *         required: true
 *         schema:
 *           type: string
 *           example: "123456789"
 *     responses:
 *       200:
 *         description: Transaction history successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "abc123"
 *                 wallet_address:
 *                   type: string
 *                   example: "0xabc...123"
 *                 tx_hash:
 *                   type: string
 *                   example: "0xdef...456"
 *                 amount:
 *                   type: number
 *                   example: 0.5
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-05-13T10:00:00Z"
 *       400:
 *         description: Missing or invalid telegram ID provided.
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
 *         description: User not found or wallet not connected.
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
 *       500:
 *         description: Internal server error during lookup.
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
      .from("rewardsHistory")
      .select("wallet_address, reward, referral, related_tx")
      .eq("tx_hash", tx_hash);

    const [userData] = tx || [];

    if (error) {
      throw new Error(error.message);
    }

    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({success: false, message: userData});
  } catch (error) {
    console.error("Error fetching user:", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
}
