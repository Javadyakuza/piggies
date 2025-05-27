import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { PurchasePigResponse } from "@/models/purchase";
import { UserHistory } from "@/models/history";
import {
  findDepth,
  getUpgradedPigLevel,
  getUser,
  prepareUserHistoryObj,
} from "@/utils/history-helper";
import { PigLevel } from "@/models/pigs";

/**
 * @swagger
 * /api/history/{walletAddr}:
 *   get:
 *     summary: Retrieve transaction history for a user by wallet address
 *     description: Resolves the user's wallet address from the given wallet address and fetches associated transaction history from the txHistory table.
 *     parameters:
 *       - name: walletAddr
 *         in: path
 *         required: true
 *         description: The wallet address of the user
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
 *         description: Invalid or missing wallet address provided.
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
 *                   example: "Invalid or missing wallet address"
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

  const { walletAddr } = req.query;

  if (!walletAddr || typeof walletAddr !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or missing wallet address" });
  }

  try {
    // Check if the user exists
    const { data: wallet_address, error: userError } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("wallet_address", walletAddr)
      .single();

    if (userError || !wallet_address) {
      return res
        .status(404)
        .json({ success: false, message: "Wallet is not connected !" });
    }

    const { data: tx, error: txError } = await supabase
      .from("txHistory")
      .select(
        "tx_id, tx_hash, wallet_address, request_status, upgradedPigLevel, created_at"
      )
      .eq("wallet_address", wallet_address.wallet_address);

    const userTxs = tx || [];

    const { data: rewards, error: RewardsError } = await supabase
      .from("rewardsHistory")
      .select("wallet_address, reward, referral, related_tx, created_at")
      .eq("wallet_address", wallet_address.wallet_address);
    console.log(rewards, tx);
    const userRewards = rewards || [];

    if (txError) {
      throw new Error(txError.message);
    }

    if (RewardsError) {
      throw new Error(RewardsError.message);
    }

    if (!userTxs || !userRewards) {
      return res
        .status(404)
        .json({ success: false, message: "Failed to fetch txs or rewards !" });
    }
    console.log(userRewards, userTxs);
    let histories: UserHistory[] = [];

    if (userTxs.length == 1) {
      console.log("userTxs.length == 1");
      histories.push(await prepareUserHistoryObj(userTxs[0]));
    }
    if (userRewards.length == 1) {
      console.log("userRewards.length == 1");
      histories.push(await prepareUserHistoryObj(userRewards[0]));
    }
    if (userTxs.length > 1) {
      console.log("userTxs.length == 1");
      // sorting the arrays
      userTxs.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // crating the histories array
      userTxs.forEach(async (tx) => {
        histories.push(await prepareUserHistoryObj(tx));
      });

      histories.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    if (userRewards.length > 1) {
      console.log("userRewards.length == 1");
      userRewards.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      userRewards.forEach(async (reward) => {
        histories.push(await prepareUserHistoryObj(reward));
      });

      histories.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return res.status(200).json({ success: true, message: histories });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
}
