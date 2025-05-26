import { TonApiClient } from "@ton-api/client";
import { TonClient } from "@ton/ton";

const TESTNET = process.env.NEXT_PUBLIC_TESTNET === "true";

export function getTonApiClient(): TonApiClient {
  console.log(process.env.NEXT_PUBLIC_TONAPI_API_KEY);
  return new TonApiClient({
    baseUrl: `https://${TESTNET ? "testnet." : ""}tonapi.io`,
    apiKey: process.env.NEXT_PUBLIC_TONAPI_API_KEY,
  });
}
export function getTonClient() {
  const endpoint = `https://${TESTNET ? "testnet." : ""}toncenter.com/api/v2/jsonRPC`;
  const apiKey = TESTNET
    ? process.env.NEXT_PUBLIC_TESTNET_TONCENTER_APIKEY
    : process.env.NEXT_PUBLIC_MAINNET_TONCENTER_APIKEY;
  return new TonClient({ endpoint, apiKey });
}
