import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { txHistory } from "@/models/history";
import { PurchasePigResponse } from "@/models/purchase";

/**
 * @swagger
 * /api/history/{telegramId}:
 *   get:
 *     summary: Retrieve transaction history for a user by Telegram ID
 *     description: Resolves the user's wallet address from the given Telegram ID and fetches associated transaction history from the txHistory table.
 *     parameters:
 *       - name: telegramId
 *         in: path
 *         required: true
 *         description: The Telegram ID of the user
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
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: object
 *                   properties:
 *                     tx_id:
 *                       type: string
 *                       example: "abc123"
 *                     tx_hash:
 *                       type: string
 *                       example: "0xdef...456"
 *                     wallet_address:
 *                       type: string
 *                       example: "0xabc...123"
 *                     request_status:
 *                       type: string
 *                       example: "approved"
 *                     upgradedPigLevel:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: Invalid or missing Telegram ID provided.
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
  res: NextApiResponse<PurchasePigResponse>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { telegramId } = req.query;

  if (!telegramId || typeof telegramId !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or missing telegram id" });
  }

  try {
    // Check if the user exists
    const { data: wallet_address, error: userError } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("telegram_id", telegramId)
      .single();

    if (userError || !wallet_address) {
      return res
        .status(404)
        .json({ success: false, message: "Wallet is not connected !" });
    }
    const { data: tx, error } = await supabase
      .from("txHistory")
      .select(
        "tx_id, tx_hash, wallet_address, request_status, upgradedPigLevel"
      )
      .eq("wallet_address", wallet_address);

    const [userData] = tx || [];

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
