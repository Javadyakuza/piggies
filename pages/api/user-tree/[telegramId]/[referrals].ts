import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { ReferralLevel, ReferralResponse, SelfReferralId, User } from "@/models/userTreeModels";


const calculateTotalPossible = (level: number): number => {
  return Math.pow(3, level);
};

const countReferralsByLevel = async (
  userId: string
): Promise<ReferralLevel[]> => {
  const countTotalUnder = (
    referralMap: { [key: string]: string[] },
    userId: string
  ): number => {
    let total = 0;
    const children = referralMap[userId] || [];
    total += children.length;
    for (const childId of children) {
      total += countTotalUnder(referralMap, childId);
    }
    return total;
  };

  const { data: allUsers, error } = await supabase
    .from("users")
    .select("id, parent_id, telegram_id, wallet_address, current_pig, fullname, inviter_id");

  if (error || !allUsers) {
    throw new Error("Failed to fetch users: " + error?.message);
  }

  const referralMap: { [key: string]: string[] } = {};
  const userMap: { [key: string]: User } = {};

  allUsers.forEach((user) => {
    if (user.id && user.telegram_id) {
      const totalInvited = allUsers.filter(
        (u) => u.inviter_id === user.id
      ).length;
    
      userMap[user.id] = {
        telegram_id: user.telegram_id,
        wallet_address: user.wallet_address || "",
        current_pig: user.current_pig ?? 0,
        fullname: user.fullname || "",
        inviter_id: user.inviter_id || "",
        total_invited: totalInvited,
      };
    }
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
  for (let i = 1; i <= 11; i++) {
    const idsAtLevel = levels[i] || [];
    const count = idsAtLevel.length;
    const total = calculateTotalPossible(i);
    const users = idsAtLevel.map((id) => {
      const user = userMap[id];
      if (user) {
        return {
          ...user,
          total_under: countTotalUnder(referralMap, id),
        };
      }
      return null;
    }).filter(Boolean) as User[];
    
    result.push({ count, total, users });
  }

  return result;
};

/**
 * @swagger
 * /api/user-tree/{telegramId}/{referrals}:
 *   get:
 *     summary: Fetches the referral data for the given user at a specific level or all levels
 *     description: This endpoint retrieves the referral tree data for a user. You can fetch one level (1–11), or all levels up to the specified number (e.g., if referrals=8, it will return levels 1–8). Use "0" to return only the user's referral ID.
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
 *         description: The level of the referral tree to fetch (1-11). Use "0" to return only the user's referral ID.
 *         required: true
 *         schema:
 *           type: string
 *           example: "8"
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
 *                       example: 3
 *                     total:
 *                       type: integer
 *                       example: 3
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           telegram_id:
 *                             type: string
 *                             example: "123456789"
 *                           wallet_address:
 *                             type: string
 *                             example: "EQBc...abc"
 *                           fullname:
 *                             type: string
 *                             example: "John Doe"
 *                           current_pig:
 *                             type: integer
 *                             example: 0
 *                           inviter_id:
 *                             type: string
 *                             example: "12"
 *                           total_invited:
 *                             type: integer
 *                             example: 3
 *                           total_under:
 *                             type: integer
 *                             example: 7
 *                 total_under:
 *                   type: integer
 *                   example: 11
 *                   description: Total number of people under the user across all levels (only present when referrals=11 or less)
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
  if (isNaN(referralsNum) || referralsNum < 0 || referralsNum > 11) {
    return res
      .status(400)
      .json({ error: "Referrals must be a number between 0 and 11" });
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
      return res.status(200).json(referral_id[0] as SelfReferralId);
    }

    let response: ReferralResponse = {};
    let totalUnder = 0;

    // Loop through levels based on referralsNum
    for (let i = 0; i < referralsNum; i++) {
      const level = referralLevels[i];
      response[`level_${i + 1}`] = {
        count: level.count,
        total: level.total,
        users: level.users,
      };
      totalUnder += level.count;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return res.status(500).json({ error: "Failed to fetch referrals" });
  }
}
