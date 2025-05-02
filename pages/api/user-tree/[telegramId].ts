import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";

/**
 * @swagger
 * /api/user-tree/{telegramId}:
 *   get:
 *     summary: Fetches the user data for the given telegramId
 *     description: This endpoint retrieves the user data based on the provided telegramId in the dynamic route parameter.
 *     parameters:
 *       - name: telegramId
 *         in: path
 *         description: The Telegram ID of the user whose data is being requested.
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
 *                 telegram_id:
 *                   type: string
 *                   example: "123456789"
 *                 inviter_id:
 *                   type: string
 *                   example: "987654321"
 *                 parent_id:
 *                   type: string
 *                   example: "567890123"
 *       400:
 *         description: Bad request due to missing or invalid telegramId in the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or missing telegram id"
 *       404:
 *         description: User not found if no user matches the provided telegramId.
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

  const { telegramId } = req.query;

  if (!telegramId || typeof telegramId !== "string") {
    return res.status(400).json({ error: "Invalid or missing telegram id" });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("telegram_id", telegramId);

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
