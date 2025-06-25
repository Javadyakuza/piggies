import { KeyPair, mnemonicToPrivateKey } from "@ton/crypto";

export async function keyPairFromEnv(): Promise<KeyPair> {
  const mnemonic = process.env.WALLET_MNEMONIC;
  if (!mnemonic) {
    throw new Error("WALLET_MNEMONIC is not set");
  }
  return await mnemonicToPrivateKey(mnemonic.split(" "));
}
