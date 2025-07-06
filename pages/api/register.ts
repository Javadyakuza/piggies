import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";
import { cookies } from "next/headers";
import { RegisterRequest } from "@/models/register";
import { getGenesisUser, getUserByReferralId } from "@/utils/purchase/dbOps";

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registers a new user in the system
 *     description: This endpoint registers a new user using a telegram_id and optionally a referral_id. If the referral_id is provided, the user will be placed under the inviter in the user tree.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telegram_id:
 *                 type: string
 *                 description: The unique Telegram ID of the user.
 *                 example: "123456789"
 *               referral_id:
 *                 type: string
 *                 description: The referral ID of the inviter. If omitted, the user will be registered as a root user.
 *                 example: "987654321"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   description: The newly registered user object.
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "abc123"
 *                     telegram_id:
 *                       type: string
 *                       example: "123456789"
 *       400:
 *         description: Bad Request if required fields are missing or invalid
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
 *                   example: "telegram_id is required"
 *       409:
 *         description: Conflict if the user is already registered
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
 *                   example: "User already registered"
 *       500:
 *         description: Internal Server Error if there was a problem with the database
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
 *                   example: "Database insert error"
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { telegram_id, referral_id, wallet_address, fullname } =
    req.body as RegisterRequest;

    console.log(telegram_id, referral_id, wallet_address, fullname, req.body as RegisterRequest)

    
  if (!telegram_id || !wallet_address) {
    return res.status(400).json({
      success: false,
      message: "telegram_id and wallet_address are required",
    });
  }

  // Optional: Check if user with this telegram_id already exists to prevent duplicates
  const { data: user } = await supabase
    .from("users")
    .select()
    .eq("wallet_address", wallet_address)
    .maybeSingle();

  // user exists
  if (user) {
    return res
      .status(409)
      .json({ success: false, message: "User already registered" });
  }

  // get the inviter id
  let { id: inviter_id } = await getUserByReferralId(String(referral_id)) || await getGenesisUser() || { id: null }; //TODO: delete fallback to genesis user?
  if (inviter_id === null) return res.status(400).json({
      success: false,
      message: "Invalid referral_id",
  });

  const { data: insertData, error } = await supabase
    .from("users")
    .insert({
      telegram_id: telegram_id,
      inviter_id: inviter_id,
      parent_id: null,
      fullname: fullname,
      wallet_address: wallet_address,
      user_type: 1,
    })
    .select() // select the inserted row to return it
    .single();

  if (error) {
    console.error("Error inserting user:", error);
    return res
      .status(500)
      .json({ success: false, message: `Database insert error ${error}` });
  }

  // Successfully inserted
  return res.status(201).json({ success: true, user: insertData });
}
