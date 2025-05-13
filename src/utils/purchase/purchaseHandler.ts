import { PurchasePigResponse, txHistory, TxId } from "@/models/purchaseModels";
import { supabase } from "../supebase";

// export const client = createClient(); // not used yet

export async function handlePigPurchase(
  userAddress: string,
  pigLevel: 1 | 2 | 3
): Promise<PurchasePigResponse> {
  // sleeping for 15 seconds to simulate the time it takes to process the transaction
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // checking the db so that we if the users request has been processed
  let purchase_tx_id = TxId.create(userAddress, 1);
  let approve_tx_id = TxId.create(userAddress, pigLevel);
  let found = false;
  let txs: txHistory[] = [];
  let max_retries = 10;
  let retries = 0;
  let backoff_secs = 3000;
  while (!found) {
    await new Promise((resolve) => setTimeout(resolve, backoff_secs));
    const { data: tx, error: fetchError } = await supabase
      .from("txHistory")
      .select("tx_id")
      .in("tx_id", [purchase_tx_id, approve_tx_id])
      .single();

    if (retries > max_retries) {
      throw new Error("Max retries exceeded ! Transaction not found !");
    }

    if (fetchError || !tx) {
      continue;
    }
    if (txs.length === 0) {
      txs.push(tx as txHistory);
    } else if (txs.length === 1) {
      if (txs[0].tx_id !== tx.tx_id) {
        txs.push(tx as txHistory);
      }
    }

    found = true;
  }

  return {
    success: true,
    message: txs,
  };
}
