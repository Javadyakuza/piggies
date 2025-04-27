import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { cookies } from "next/headers";
import { findOpenSlotInSubtree } from "@/utils/tree";

type RequestBody = {
  telegram_id: string;
  referral_id?: string | number;
};


type RegisterResponse = {
  success: boolean;
  user?: any;
  message?: string;
};

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

  const { telegram_id, referral_id } = req.body as RequestBody;
  if (!telegram_id) {
    return res
      .status(400)
      .json({ success: false, message: "telegram_id is required" });
  }

  if (!referral_id) {
    return res
      .status(400)
      .json({ success: false, message: "registration is only available via referral link !" });
  }

  // Optional: Check if user with this telegram_id already exists to prevent duplicates
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegram_id)
    .maybeSingle();
  if (existing) {
    return res
      .status(409)
      .json({ success: false, message: "User already registered" });
  }

  // Determine the parent_id for the new user via referral logic
  let parentId: string | number | null = null;
  let inviterId: string | number | null = null;
  if (referral_id) {
    // If a referral (inviter) is provided, find that user
    const { data: inviter } = await supabase
      .from("users")
      .select("id")
      .eq("referral_id", referral_id)
      .single();
    if (!inviter) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid referral_id (inviter not found)",
        });
    }
    inviterId = inviter.id;
    // Find an open slot in inviter's subtree for the new user
    parentId = await findOpenSlotInSubtree(String(inviterId));
    if (!parentId) {
      // If for some reason no slot found (tree completely full), default to attaching to inviter
      parentId = inviterId;
    }
  }
  // If no referral_id provided (direct registration or first user), parentId and inviterId remain null (user is root of a new tree).

  // Insert the new user into the database
  const { data: insertData, error } = await supabase
    .from("users")
    .insert({
      telegram_id: telegram_id,
      inviter_id: inviterId,
      parent_id: parentId,
      // created_at will default to now() if set in DB default
    })
    .select() // select the inserted row to return it
    .single();

  if (error) {
    console.error("Error inserting user:", error);
    return res
      .status(500)
      .json({ success: false, message: "Database insert error" });
  }

  // Successfully inserted
  return res.status(201).json({ success: true, user: insertData });
}
