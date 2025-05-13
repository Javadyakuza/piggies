import {
  Address,
  OpenedContract,
  toNano,
  TonClient,
  WalletContractV5R1,
} from "@ton/ton";
import { keyPairFromEnv } from "./helpers";
import { PigShop } from "../wrappers/PigShop";

export async function sendUpgradePig(
  pigShop: OpenedContract<PigShop>,
  wallet: OpenedContract<WalletContractV5R1>
) {
  let secretKey = (await keyPairFromEnv()).secretKey;

  await pigShop.send(
    wallet.sender(secretKey),
    {
      value: toNano("0.1"),
    },

    "UpgradePig"
  );
}
