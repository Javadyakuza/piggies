import type { NextApiRequest, NextApiResponse } from "next";
import { InviteeRequest } from "@/models/userTree";
import { supabase } from "@/utils/supabase";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { telegram_id, wallet_address } =
        req.query as InviteeRequest;

    if (!wallet_address || typeof wallet_address !== "string") {
        return res
            .status(400)
            .json({ error: "Invalid or missing referrals wallet address parameter" });
    }

    const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegram_id)
        .eq("wallet_address", wallet_address)
        .single();

    if (userError || !user) {
        return res.status(404).json({ error: "User not found" });
    }

    try {
        const { data: response, error: inviteesError } = await supabase
            .from("users")
            .select("id, parent_id, telegram_id, wallet_address, current_pig, fullname, inviter_id")
            .eq("inviter_id", user.id)
            .gt("current_pig", 0)
            .order('created_at', { ascending: false });

        if (inviteesError) throw inviteesError;

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching invitees:", error);
        return res.status(500).json({ error: `Failed to fetch invitees ${error}` });
    }
}
