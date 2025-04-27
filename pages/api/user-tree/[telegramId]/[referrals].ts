import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";

interface ReferralLevel {
  count: number;
  total: number;
}

interface ReferralResponse {
  [key: string]: ReferralLevel;
}

interface SelfReferralId {
  referral_id: string;
}

const calculateTotalPossible = (level: number): number => {
  return Math.pow(3, level);
};

const countReferralsByLevel = async (
  userId: string
): Promise<ReferralLevel[]> => {
  const { data: allUsers, error } = await supabase
    .from("users")
    .select("id, parent_id");

  if (error || !allUsers) {
    throw new Error("Failed to fetch users: " + error?.message);
  }

  const referralMap: { [key: string]: string[] } = {};
  allUsers.forEach((user: { id: string; parent_id: string | null }) => {
    const parent = user.parent_id;
    if (parent) {
      if (!referralMap[parent]) {
        referralMap[parent] = [];
      }
      referralMap[parent].push(user.id);
    }
  });

  const levels: string[][] = [[], []];
  const queue: { userId: string; level: number }[] = [{ userId, level: 0 }];
  const visited: Set<string> = new Set();

  while (queue.length > 0) {
    const { userId: currentUser, level } = queue.shift()!;
    if (visited.has(currentUser)) continue;
    visited.add(currentUser);

    if (level > 0) {
      if (!levels[level]) levels[level] = [];
      levels[level].push(currentUser);
    }

    const referrals = referralMap[currentUser] || [];
    referrals.forEach((referralId) => {
      queue.push({ userId: referralId, level: level + 1 });
    });
  }

  const result: ReferralLevel[] = [];
  for (let i = 1; i <= 7; i++) {
    const count = levels[i]?.length || 0;
    const total = calculateTotalPossible(i);
    result.push({ count, total });
  }

  return result;
};
/**
 * @swagger
 * /api/user-tree/{telegramId}/{referrals}:
 *   get:
 *     summary: Fetches the referral data for the given user at a specific level or all levels
 *     description: This endpoint retrieves the referral tree data for a user, and allows you to fetch data at a specific referral level (1-8).
 *     parameters:
 *       - name: telegramId
 *         in: path
 *         description: The Telegram ID of the user whose referral data is being requested.
 *         required: true
 *         schema:
 *           type: string
 *           example: "123456789"
 *       - name: referrals
 *         in: path
 *         description: The level of the referral tree to fetch (1-8). Use "0" for the user's self-referral ID.
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *     responses:
 *       200:
 *         description: The referral data has been successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 level_1:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 5
 *                     total:
 *                       type: integer
 *                       example: 3
 *                 level_2:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 9
 *                 # For all levels, up to level 8
 *                 level_8:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 27
 *       400:
 *         description: Bad request due to invalid or missing telegramId or referrals parameter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or missing id"
 *       404:
 *         description: User not found if the user with the provided telegramId does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error if there was an issue fetching the referral data.
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

  const { telegramId, referrals } = req.query;

  if (!telegramId || typeof telegramId !== "string") {
    return res.status(400).json({ error: "Invalid or missing telegram id" });
  }

  if (!referrals || typeof referrals !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid or missing referrals parameter" });
  }

  const referralsNum = parseInt(referrals, 10);
  if (isNaN(referralsNum) || referralsNum < 0 || referralsNum > 8) {
    return res
      .status(400)
      .json({ error: "Referrals must be a number between 0 and 8" });
  }

  const { data: userExists, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (userError || !userExists) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const referralLevels = await countReferralsByLevel(userExists.id);

    if (referralsNum === 0) {
      const { data: referral_id, error } = await supabase
        .from("users")
        .select("referral_id")
        .eq("telegram_id", telegramId);

      if (error || !referral_id) {
        return res.status(404).json({ error: "User not found" });
      }
      console.log("START", referral_id, "END");

      return res.status(200).json(referral_id[0] as SelfReferralId);
    }

    if (referralsNum === 8) {
      const response: ReferralResponse = {};
      referralLevels.forEach((level, index) => {
        response[`level_${index + 1}`] = {
          count: level.count,
          total: level.total,
        };
      });
      return res.status(200).json(response);
    } else {
      const level = referralLevels[referralsNum - 1];
      return res.status(200).json({
        count: level.count,
        total: level.total,
      });
    }
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return res.status(500).json({ error: "Failed to fetch referrals" });
  }
}
