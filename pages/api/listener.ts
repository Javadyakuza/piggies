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
//   console.log(
//     loadUpgradePig(
//     //  Cell.fromBoc(
//         Cell.EMPTY.asBuilder().storeStringTail("b5ee9c720101040100a20001a17369676e7ffffffd684e199a000000228881a35f1b1edd6682587c8291d19f1622449cfe34c98fe73fc9dbeb8044c4dc41aec7c335d9ace37c660a9caa443173743c57cd0e49c6a52a3166ee26ac86026001020a0ec3c86d030203000000826200343002c03bcad1e7147abebeb11787b33e8c385d69b9d83afd56376983d5526f1cc4b400000000000000000000000000000000000055706772616465506967").asCell().asSlice()
//     //  )
//     )
//   );
  await listenPigShopForever();
  return res.status(200).json({ success: true, message: "ok" });
}
