import {
  Address,
  beginCell,
  OpenedContract,
  toNano,
  TonClient,
  WalletContractV5R1,
} from "@ton/ton";
import { keyPairFromEnv } from "./helpers";
import { PigShop } from "../wrappers/PigShop";
import { supabase } from "@/utils/supebase";
import { PurchasePigResponse, UpgradePigTx } from "@/models/purchase";
import { calculatePigPrice } from "@/utils/purchase/pigPrice";

// export async function sendUpgradePig(
//   pigShop: OpenedContract<PigShop>,
//   wallet: OpenedContract<WalletContractV5R1>
// ) {
//   let secretKey = (await keyPairFromEnv()).secretKey;

//   await pigShop.send(
//     wallet.sender(secretKey),
//     {
//       value: toNano("0.1"),
//     },

//     "UpgradePig"
//   );
// }

export async function getUpgradePigTx(
  wallet_address: string
): Promise<PurchasePigResponse> {
  // Check if the user exists
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("wallet_address, current_pig")
    .eq("wallet_address", wallet_address)
    .single();

  if (userError || !user.wallet_address || !user.current_pig) {
    return { success: false, message: "no wallets, no pigs ?!#$" };
  }
  const payloadCell = beginCell()
    .storeUint(0, 32) // opcode for comment
    .storeStringTail("UpgradePig") // the string your contract listens to
    .endCell();

  const payloadBase64 = payloadCell.toBoc().toString("base64");

  const PigCost = await calculatePigPrice(user.current_pig + 1);

  const transaction: UpgradePigTx = {
    tx: {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: process.env.PIGSHOP_ADDRESS!,
          amount: PigCost.toString(),
          payload: payloadBase64,
        },
      ],
    },
    pigLevel: user.current_pig + 1,
  };

  return { success: true, message: transaction };
}
