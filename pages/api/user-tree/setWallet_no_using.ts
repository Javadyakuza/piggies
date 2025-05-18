// import type { NextApiRequest, NextApiResponse } from "next";
// import { supabase } from "@/utils/supebase";
// import { SetWalletRequest } from "@/models/userTree";

// export type ResponseData = {
//   success: boolean;
//   message: string;
// };

// /**
//  * @swagger
//  * /api/user-tree/setWallet:
//  *   post:
//  *     summary: Registers or updates the wallet address for a user
//  *     description: This endpoint updates the user's wallet address using their Telegram ID. If the user does not exist, it returns a 404 error.
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - telegram_id
//  *               - wallet_address
//  *             properties:
//  *               telegram_id:
//  *                 type: string
//  *                 description: The Telegram ID of the user.
//  *                 example: "168185687"
//  *               wallet_address:
//  *                 type: string
//  *                 description: The user's TON wallet address.
//  *                 example: "EQC1e9Y...X9r8hV"
//  *     responses:
//  *       200:
//  *         description: Wallet address successfully registered.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: Wallet address registered successfully
//  *       400:
//  *         description: Missing telegram_id or wallet_address in request body.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: Missing telegram_id or wallet_address
//  *       404:
//  *         description: User not found for given telegram_id.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: User not found
//  *       500:
//  *         description: Internal server error while updating wallet address.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: Failed to update wallet address
//  */

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<ResponseData>
// ) {
//   if (req.method !== "POST") {
//     return res
//       .status(405)
//       .json({ success: false, message: "Method not allowed" });
//   }

//   const { telegram_id, wallet_address } = req.body as SetWalletRequest;

//   if (!telegram_id || !wallet_address) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Missing telegram_id or wallet_address" });
//   }

//   // Check if the user exists
//   const { data: user, error: userError } = await supabase
//     .from("users")
//     .select("id")
//     .eq("telegram_id", telegram_id)
//     .single();

//   if (userError || !user) {
//     return res.status(404).json({ success: false, message: "User not found" });
//   }

//   // Update wallet address
//   const { error: updateError } = await supabase
//     .from("users")
//     .update({ wallet_address })
//     .eq("telegram_id", telegram_id);

//   if (updateError) {
//     console.error("Wallet update error:", updateError);
//     return res.status(500).json({ success: false, message: "Failed to update wallet address" });
//   }

//   return res.status(200).json({ success: true, message: "Wallet address registered successfully" });
// }
