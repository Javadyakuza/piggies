import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";
import { batchReferralsRequest } from "@/models/userTree";

/**
 * @swagger
 * /api/user-tree/batchReferrals:
 *   get:
 *     summary: Get referrals for a user by wallet address
 *     description: >
 *       Retrieves all users referred by the user associated with the given `wallet_address`.
 *       The address is used to find the user ID, and then all users with that ID as their `inviter_id` are returned.
 *     parameters:
 *       - name: wallet_address
 *         in: path
 *         required: true
 *         description: The wallet address of the user whose referral tree is requested
 *         schema:
 *           type: string
 *           example: "0xabc123..."
 *     responses:
 *       200:
 *         description: List of referred users successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "user_1"
 *                   wallet_address:
 *                     type: string
 *                     example: "0xabc123..."
 *                   inviter_id:
 *                     type: string
 *                     example: "user_0"
 *                   parent_id:
 *                     type: string
 *                     example: "user_root"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-05-25T12:34:56.789Z"
 *       400:
 *         description: Missing or invalid wallet address in request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or missing wallet address"
 *       404:
 *         description: No user found for the given wallet address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Method not allowed"
 *       500:
 *         description: Internal server error occurred
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { wallet_address } = req.query as batchReferralsRequest;

  if (!wallet_address || typeof wallet_address !== "string") {
    return res.status(400).json({ error: "Invalid or missing wallet address" });
  }

  try {
    const { data: id, error } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", wallet_address)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!id) {
      return res.status(404).json({ error: "User not found" });
    }

    const { data: referrals, error: referralsError } = await supabase
      .from("users")
      .select()
      .eq("inviter_id", id.id);

      
    if (referralsError) {
      throw new Error(referralsError.message);
    }

    if (!referrals) {
      return res.status(200).json([]);
    }
    return res.status(200).json(referrals);
  } catch (error) {
    console.error("Error fetching user(batchReferrals):", error);
    return res.status(500).json({ error: String(error) });
  }
}
