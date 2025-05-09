import { PurchasePigResponse } from "@/models/pigModels";
import { TonApiClient } from "@ton-api/client";
import { Address } from "@ton/core";

// Initialize the TonApi
const ta = new TonApiClient({
  baseUrl: "https://tonapi.io",
  apiKey: "YOUR_API_KEY",
});

export async function handlePigPurchase(): Promise<PurchasePigResponse> {

  // sleeping for 15 seconds to simulate the time it takes to process the transaction
  await new Promise((resolve) => setTimeout(resolve, 15000)); 
  
  // getting the transaction based on the input params

  return {} as PurchasePigResponse;
}

async function getRelativeTransaction(
  contract_address: string,
  user_address: number
) {
  const txs = await ta.blockchain.getBlockchainAccountTransactions(
    Address.parse(contract_address),
    {
      limit: 50,
    }
  );

  if (txs.transactions.length === 0) {
    return {
      success: false,
      message: "No transactions found for this address",
    };
  }

  const transaction = transactions[0];
  if (transaction.in_msg !== null) {
    return transaction;
  }
  return null;
}
