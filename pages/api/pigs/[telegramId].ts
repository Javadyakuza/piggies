import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { PigLevels, UserPigs } from "@/models/pigs";



/**
 * @swagger
 * /api/pigs/{telegramId}:
 *   get:
 *     summary: Fetches the pig data for the given Telegram ID
 *     description: This endpoint retrieves pig level information for a user based on their Telegram ID, including their current pig level and available pigs to buy.
 *     parameters:
 *       - name: telegramId
 *         in: path
 *         description: The Telegram ID for the user whose pig data is being requested.
 *         required: true
 *         schema:
 *           type: string
 *           example: "168185687"
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
 *                     - 0  # Nothing
 *                     - 1  # Bronze
 *                     - 2  # Silver
 *                     - 3  # Gold
 *                     - 4  # Diamond
 *                   description: The current pig level of the user.
 *                   example: 1  # Bronze
 *                 buyable_pigs:
 *                   type: integer
 *                   enum:
 *                     - 0  # Nothing
 *                     - 1  # Bronze
 *                     - 2  # Silver
 *                     - 3  # Gold
 *                     - 4  # Diamond
 *                   description: The next available pig level that the user can buy.
 *                   example: 2  # Silver
 *       400:
 *         description: Bad request if `telegramId` is missing or invalid.
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
 *                   example: "telegramId is required"
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

  const { telegramId } = req.query;

  if (!telegramId) {
    return res
      .status(400)
      .json({ success: false, message: "telegramId is required" });
  }

  // Fetch the user's data from the database
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("wallet_address, current_pig")
    .eq("telegram_id", telegramId)
    .single();

  if (userError || !user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Get the current pig value from the database (assumed to be a number between 0 and 4)
  const current_pig = user.current_pig;

  // Calculate the pig level based on current_pig
  let pig_level: PigLevels = PigLevels.Nothing;  // Default is Nothing
  if (current_pig >= PigLevels.Bronze) pig_level = PigLevels.Bronze;
  if (current_pig >= PigLevels.Silver) pig_level = PigLevels.Silver;
  if (current_pig >= PigLevels.Gold) pig_level = PigLevels.Gold;
  if (current_pig >= PigLevels.Diamond) pig_level = PigLevels.Diamond;

  // Calculate the next available pig level to buy (buyable pig is current_pig + 1)
  let buyable_pigs: PigLevels = PigLevels.Nothing;  // Default is Nothing
  if (current_pig + 1 >= PigLevels.Bronze) buyable_pigs = PigLevels.Bronze;
  if (current_pig + 1 >= PigLevels.Silver) buyable_pigs = PigLevels.Silver;
  if (current_pig + 1 >= PigLevels.Gold) buyable_pigs = PigLevels.Gold;
  if (current_pig + 1 >= PigLevels.Diamond) buyable_pigs = PigLevels.Diamond;

  // Prepare the response data
  const responseData: UserPigs = {
    wallet_address: user.wallet_address,
    pig_level: pig_level,
    buyable_pigs: buyable_pigs,
  };

  return res.status(200).json(responseData);
}
