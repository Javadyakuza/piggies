import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";

/**
 * @swagger
 * /api/pigs/app=data/{pigType}:
 *   get:
 *     summary: Fetches user data based on pigType
 *     description: Retrieves user data from the appData table where the tier matches the provided pigType query parameter.
 *     parameters:
 *       - name: pigType
 *         in: query
 *         description: The tier (pigType) to filter the user data.
 *         required: true
 *         schema:
 *           type: string
 *           example: "bronze"
 *     responses:
 *       200:
 *         description: The user data has been successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "abc123"
 *                 tier: "bronze"
 *                 name: "John Doe"
 *       400:
 *         description: Bad request due to missing or invalid pigType query parameter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or missing pigType"
 *       404:
 *         description: No user data found matching the provided pigType.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error while querying the database.
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

  const { pigType } = req.query;

  if (!pigType || typeof pigType !== "string") {
    return res.status(400).json({ error: "Invalid or missing pigType" });
  }

  try {
    const { data: pigData, error } = await supabase
      .from("appData")
      .select()
      .eq("tier", pigType)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!pigData) {
      return res.status(404).json({ error: "Pig type not found" });
    }
    return res.status(200).json(pigData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
