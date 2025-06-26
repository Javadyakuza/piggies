import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";
import {
  ReferralLevel,
  ReferralRequest,
  ReferralResponse,
  SelfReferralId,
  User,
} from "@/models/userTree";

const calculateTotalPossible = (level: number): number => {
  return Math.pow(3, level);
};


export const countReferralsByLevel = async (
  wallet_address: string
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
    .select(
      "id, parent_id, telegram_id, wallet_address, current_pig, fullname, inviter_id, user_type"
    );

  if (error || !allUsers) {
    throw new Error("Failed to fetch users: " + error?.message);
  }

  const targetUser = allUsers.find(
    (u) => u.wallet_address === wallet_address
  );

  if (!targetUser) {
    throw new Error("User not found with the given wallet address");
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
        user_type: user.user_type,
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

  const levels: string[][] = [[]]; // Level 0 is skipped in result
  const queue: { userId: string; level: number }[] = [
    { userId: targetUser.id, level: 0 },
  ];
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
    const users = idsAtLevel
      .map((id) => {
        const user = userMap[id];
        if (user) {
          return {
            ...user,
            total_under: countTotalUnder(referralMap, id),
          };
        }
        return null;
      })
      .filter(Boolean) as User[];

    result.push({ count, total, users });
  }

  return result;
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
 *       - `1` to `11` returns level-by-level referral stats.
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
 *         description: Depth of referrals to return (0–11 or "batch")
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
 *                   description: Returned when referrals=1–11
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

  const referralsNum = parseInt(referrals == "batch" ? "11" : referrals, 10);
  if (isNaN(referralsNum) || referralsNum < 0 || referralsNum > 11) {
    return res
      .status(400)
      .json({ error: "Referrals must be a number between 0 and 11" });
  }

  const { data: userExists, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegram_id)
    .eq("wallet_address", wallet_address)
    .single();

  if (userError || !userExists) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const referralLevels = await countReferralsByLevel(
      wallet_address
    );

    if (referralsNum === 0) {
      const { data: referral_id, error } = await supabase
        .from("users")
        .select("referral_id")
        .eq("telegram_id", telegram_id);

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
    if (referrals == "batch") {
      let users = new Map<Number, User[]>();
      let counter = 1;
      Object.entries(response).forEach(([_, value]) => {
        users.set(counter, value.users);
        counter += 1;
      });
      return res.status(200).json(Object.fromEntries(users));
    }
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return res.status(500).json({ error: `Failed to fetch referrals ${error}` });
  }
}
