import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supebase";
import { cookies } from "next/headers";
import { findOpenSlotInSubtree } from "@/utils/tree";
import { RegisterRequest } from "@/models/register";
import { listenPigShopForever } from "@/utils/purchase/listenNode";
import { loadUpgradePig } from "../../wrappers/PigShop";
import { Cell } from "@ton/core";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers["authorization"];
  const expectedToken = `Bearer ${process.env.API_SECRET_TOKEN}`;
  console.log(expectedToken, authHeader)
  if (authHeader !== expectedToken) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Start the listener but don't wait for it
  listenPigShopForever().catch(err => {
    console.error("listenPigShopForever error:", err);
  });

  return res.status(200).json({ success: true, message: "ok" });
}
