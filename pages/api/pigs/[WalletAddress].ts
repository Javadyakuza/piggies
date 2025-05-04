import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { cookies } from "next/headers";
import { findOpenSlotInSubtree } from "@/utils/tree";

enum PigLevels {
  Nothing,
  Bronze,
  Silver,
  Gold,
  Diamond,
}

interface UserPigs {
  wallet_address: string;
  pig_level: PigLevels;
  buyable_pigs: PigLevels;
}
/**
 * @swagger
 * /api/pigs/{WalletAddress}:
 *   get:
 *     summary: Fetches the pig data for the given wallet address
 *     description: This endpoint retrieves pig level information for a user based on their wallet address, including their current pig level and available pigs to buy.
 *     parameters:
 *       - name: WalletAddress
 *         in: path
 *         description: The wallet address for the user whose pig data is being requested.
 *         required: true
 *         schema:
 *           type: string
 *           example: "UQAYgpK3sLR5qTeUQ_N4p6Prw3HJSR4gHyeA0kXYO_C_bXbx"
 *     responses:
 *       200:
 *         description: Successfully retrieved pig data for the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallet_address:
 *                   type: string
 *                   example: "UQAYgpK3sLR5qTeUQ_N4p6Prw3HJSR4gHyeA0kXYO_C_bXbx"
 *                 pig_level:
 *                   type: integer
 *                   enum:
 *                     - 0  # Bronze
 *                     - 1  # Silver
 *                     - 2  # Gold
 *                     - 3  # Diamond
 *                   description: The current pig level of the user.
 *                   example: 0  # Bronze
 *                 buyable_pigs:
 *                   type: integer
 *                   enum:
 *                     - 0  # Bronze
 *                     - 1  # Silver
 *                     - 2  # Gold
 *                     - 3  # Diamond
 *                   description: The next available pig level that the user can buy.
 *                   example: 1  # Silver
 *       400:
 *         description: Bad request if `WalletAddress` is missing or invalid.
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
 *                   example: "WalletAddress is required"
 *       405:
 *         description: Method not allowed if the request method is not GET.
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
 *         description: Internal server error if there is an error during the process.
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
 *                   example: "Internal server error"
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { WalletAddress } = req.query;

  if (!WalletAddress) {
    return res
      .status(400)
      .json({ success: false, message: "wallet_address is required" });
  }

  /// @dev place to write the logic to fetch pig data from ton blockchain
  let sampleResponse: UserPigs = {
    wallet_address: "UQAYgpK3sLR5qTeUQ_N4p6Prw3HJSR4gHyeA0kXYO_C_bXbx",
    pig_level: PigLevels.Bronze,
    buyable_pigs: PigLevels.Silver,
  };
  return res.status(200).json(sampleResponse);
}
