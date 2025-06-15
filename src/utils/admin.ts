import { TonApiClient } from "@ton-api/client";
import { OpenedContract, TonClient, WalletContractV5R1 } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { ContractAdapter } from "@ton-api/ton-adapter";

export async function getAdminWallet(
  tc: TonClient
): Promise<OpenedContract<WalletContractV5R1>> {
  if (!process.env.NEXT_PUBLIC_WALLET_MNEMONIC) {
    throw new Error("ADMIN_MNEMONIC is not set");
  }
  const mnemonics = process.env.NEXT_PUBLIC_WALLET_MNEMONIC.split(" ");
  const keyPair = await mnemonicToPrivateKey(mnemonics);
  return tc.open(
    WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    })
  );
}
