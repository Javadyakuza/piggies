// Assuming you have imported necessary TON SDK modules
import { TonClient, WalletContractV4, WalletContractV5R1, internal, toNano } from "@ton/ton";
import { beginCell, Address, Dictionary, OpenedContract } from "@ton/core";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { PigApproval, PigShop, storePigApproval } from "../../build/PigShop/tact_PigShop";
import { bountyHuntersResponse } from "@/models/purchase";
import { keyPairFromEnv } from "./helpers";

export async function sendPigApproval(
  bh: bountyHuntersResponse,
  wallet: OpenedContract<WalletContractV5R1>,
  pigShop: OpenedContract<PigShop>,
  pig: Address | null,
  mainUser: string,
) {
  let secretKey = (await keyPairFromEnv()).secretKey;

  const approvalMsg: PigApproval = {
    $$type: "PigApproval",
    userBountyHunters: bh.users,
    adminsShares: bh.admins,
    userAddress: Address.parse(mainUser),
    pig
  };

  await pigShop.send(
    wallet.sender(secretKey),
    {
      value: toNano("0.1"),
    },
    approvalMsg
  );

  console.log("PigApproval message sent.");
}
