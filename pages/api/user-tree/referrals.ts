import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";
import { ReferralRequest, ReferralResponse } from "@/models/userTree";

type ReferralsByLevel = {
  depth: number;
  current_pig: number;
  users_count: number;
};

export const countReferralsByLevel = async (
  user_id: string,
  max_depth = 12
): Promise<ReferralsByLevel[]> => {
  const { data, error } = await supabase
    .rpc('get_referral_tree_aggregated', {
      user_id,
      max_depth,
    });

  if (error) throw error;
  return data || [];
};

/**
 * @swagger
 * /api/user-tree/referrals:
 *   get:
 *     summary: Fetch referral tree data for a user
 *     description: >
 *       Returns the referral data for a user based on their Telegram ID and wallet address.
 *       The `referrals` query param controls depth:
 *
 *       - `0` returns only the user's `referral_id`.
 *       - `1` to `12` returns level-by-level referral stats.
 *       - `"batch"` returns a simplified map of levels to user arrays.
 *     parameters:
 *       - name: telegram_id
 *         in: query
 *         required: true
 *         description: Telegram ID of the user
 *         schema:
 *           type: string
 *           example: "123456789"
 *       - name: referrals
 *         in: query
 *         required: true
 *         description: Depth of referrals to return (0–12 or "batch")
 *         schema:
 *           type: string
 *           example: "3"
 *       - name: wallet_address
 *         in: query
 *         required: true
 *         description: Wallet address of the user
 *         schema:
 *           type: string
 *           example: "EQBc...abc"
 *     responses:
 *       200:
 *         description: Referral data successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Returned when referrals=0
 *                   properties:
 *                     referral_id:
 *                       type: string
 *                       example: "ref123"
 *                 - type: object
 *                   description: Returned when referrals=1–12
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                         example: 3
 *                       total:
 *                         type: integer
 *                         example: 9
 *                       users:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             telegram_id:
 *                               type: string
 *                               example: "123456789"
 *                             wallet_address:
 *                               type: string
 *                               example: "EQBc...abc"
 *                             fullname:
 *                               type: string
 *                               example: "Jane Doe"
 *                             current_pig:
 *                               type: integer
 *                               example: 1
 *                             inviter_id:
 *                               type: string
 *                               example: "abc456"
 *                             total_invited:
 *                               type: integer
 *                               example: 4
 *                             total_under:
 *                               type: integer
 *                               example: 10
 *                 - type: object
 *                   description: Returned when referrals="batch"
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         telegram_id:
 *                           type: string
 *                         wallet_address:
 *                           type: string
 *                         fullname:
 *                           type: string
 *                         current_pig:
 *                           type: integer
 *                         inviter_id:
 *                           type: string
 *                         total_invited:
 *                           type: integer
 *                         total_under:
 *                           type: integer
 *       400:
 *         description: Missing or invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or missing telegram id"
 *       404:
 *         description: User not found
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
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch referrals"
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { telegram_id, referrals, wallet_address } =
    req.query as ReferralRequest;

  if (!telegram_id || typeof telegram_id !== "string") {
    return res.status(400).json({ error: "Invalid or missing telegram id" });
  }

  if (!referrals || typeof referrals !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid or missing referrals parameter" });
  }

  if (!wallet_address || typeof wallet_address !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid or missing referrals wallet address parameter" });
  }

  const referralsNum = parseInt(referrals == "batch" ? "12" : referrals, 10);
  if (isNaN(referralsNum) || referralsNum < 0 || referralsNum > 12) {
    return res
      .status(400)
      .json({ error: "Referrals must be a number between 0 and 12" });
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegram_id)
    .eq("wallet_address", wallet_address)
    .single();

  if (userError || !user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const referralsByLevels = await countReferralsByLevel(
      user.id,
      referralsNum
    );

    const response: ReferralResponse = {};
    for (let depth = 1; depth <= referralsNum; depth++) {
      response[depth] = {};
    }

    // Loop through levels based on referralsNum
    for (const referrals of referralsByLevels) {
      response[referrals.depth] = {
        ...(response[referrals.depth] ?? {}),
        [referrals.current_pig]: referrals.users_count,
      };
    }
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return res.status(500).json({ error: `Failed to fetch referrals ${error}` });
  }
}
