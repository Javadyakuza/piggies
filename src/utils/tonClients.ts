import { TonApiClient } from "@ton-api/client";
import { TonClient } from "@ton/ton";

const TESTNET = process.env.NEXT_PUBLIC_TESTNET === "true";

export function getTonApiClient(): TonApiClient {
  return new TonApiClient({
    baseUrl: `https://${TESTNET ? "testnet." : ""}tonapi.io`,
    apiKey: process.env.NEXT_PUBLIC_TONAPI_API_KEY,
  });
}
export function getTonCenterClient() {
  const endpoint = `https://${TESTNET ? "testnet." : ""}toncenter.com/api/v2/jsonRPC`;
  const apiKey = TESTNET
    ? process.env.NEXT_PUBLIC_TESTNET_TON_CENTER_API_KEY
    : process.env.NEXT_PUBLIC_MAINNET_TON_CENTER_API_KEY;
  return new TonClient({ endpoint, apiKey });
}
