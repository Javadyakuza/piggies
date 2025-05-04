import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";

type RequestBody = {
  telegram_id: string;
};

type ResponseData = {
  success: boolean;
  message: string;
};
/**
 * @swagger
 * /api/pigs/upgradePig:
 *   post:
 *     summary: Updates the pig value for a user
 *     description: This endpoint increments the user's current_pig value by 1 using their Telegram ID. If the user does not exist, it returns a 404 error.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telegram_id
 *             properties:
 *               telegram_id:
 *                 type: string
 *                 description: The Telegram ID of the user.
 *                 example: "168185687"
 *     responses:
 *       200:
 *         description: Pig value successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pig value updated successfully
 *       400:
 *         description: Missing telegram_id in request body.
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
 *                   example: Missing telegram_id
 *       404:
 *         description: User not found for given telegram_id.
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
 *                   example: User not found
 *       500:
 *         description: Internal server error while updating pig value.
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
 *                   example: Failed to update pig value
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { telegram_id } = req.body as RequestBody;

  if (!telegram_id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing telegram_id" });
  }

  // Check if the user exists
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, current_pig")
    .eq("telegram_id", telegram_id)
    .single();

  if (userError || !user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Increment the "current_pig" value by 1
  const newPigValue = user.current_pig + 1;

  // Update the current_pig value
  const { error: updateError } = await supabase
    .from("users")
    .update({ current_pig: newPigValue })
    .eq("telegram_id", telegram_id);

  if (updateError) {
    console.error("Update error:", updateError);
    return res.status(500).json({ success: false, message: "Failed to update pig value" });
  }

  return res.status(200).json({ success: true, message: "Pig value updated successfully" });
}
