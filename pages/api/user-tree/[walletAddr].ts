import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import * as crypto from "crypto";
import { Address } from "@ton/ton";
/**
 * @swagger
 * /api/user-tree/{walletAddr}:
 *   get:
 *     summary: Fetches the user data for the given walletAddr
 *     description: This endpoint retrieves the user data based on the provided walletAddr in the dynamic route parameter.
 *     parameters:
 *       - name: walletAddr
 *         in: path
 *         description: The wallet address of the user whose data is being requested.
 *         required: true
 *         schema:
 *           type: string
 *           example: "123456789"
 *     responses:
 *       200:
 *         description: The user data has been successfully retrieved.
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
 *                   example: "123456789"
 *                 inviter_id:
 *                   type: string
 *                   example: "987654321"
 *                 parent_id:
 *                   type: string
 *                   example: "567890123"
 *       400:
 *         description: Bad request due to missing or invalid walletAddr in the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or missing wallet address"
 *       404:
 *         description: User not found if no user matches the provided walletAddr.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error if there was an issue querying the database.
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

  const { walletAddr } = req.query;

  if (!walletAddr || typeof walletAddr !== "string") {
    return res.status(400).json({ error: "Invalid or missing wallet address" });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("wallet_address", walletAddr);

    const [userData] = data || [];

    if (error) {
      throw new Error(error.message);
    }

    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
