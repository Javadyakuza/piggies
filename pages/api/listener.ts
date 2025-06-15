import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { cookies } from "next/headers";
import { findOpenSlotInSubtree } from "@/utils/tree";
import { RegisterRequest } from "@/models/register";
import { getParentId } from "@/utils/purchase/dbOps";
import { listenPigShopForever } from "@/utils/purchase/listenNode";
import { loadUpgradePig } from "../../wrappers/PigShop";
import { Cell } from "@ton/core";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Get token from header
  const authHeader = req.headers["authorization"];

  // 2. Check against env secret
  const expectedToken = `Bearer ${process.env.API_SECRET_TOKEN}`;

  if (authHeader !== expectedToken) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Your secured logic
  await listenPigShopForever();

  return res.status(200).json({ success: true, message: "ok" });
}
