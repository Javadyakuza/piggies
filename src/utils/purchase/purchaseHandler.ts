import { PurchasePigResponse } from "@/models/purchase";
import { txHistory, TxId } from "@/models/history";
import { supabase } from "../supabase";
import { PigLevel } from "@/models/pigs";
import { isDuplicatePurchase } from "./dbOps";
import { Address } from "@ton/core";

// export const client = createClient(); // not used yet

export async function handlePigPurchase(
  userAddress: string,
  pigLevel: PigLevel
): Promise<PurchasePigResponse> {
  if (pigLevel === 4) {
    return {
      success: false,
      message: "your pig is already maxed out",
    };
  }
  let userAddr = Address.parse(userAddress);
  let tx_id = TxId.create(userAddr.toRawString(), pigLevel);
  let isDuplicate = await isDuplicatePurchase(userAddr.toRawString(), pigLevel);

  if (isDuplicate) {
    return {
      success: true,
      message: "your request has already been processed !",
    };
  }
  // sleeping for 15 seconds to simulate the time it takes to process the transaction
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // checking the db so that we if the users request has been processed
  let found = false;
  let max_retries = 10;
  let retries = 0;
  let backoff_secs = 3000;
  while (!found) {
    await new Promise((resolve) => setTimeout(resolve, backoff_secs));
    const { data: tx, error: fetchError } = await supabase
      .from("tx_history")
      .select()
      .eq("tx_id", tx_id)
      .single();

    if (retries > max_retries) {
      throw new Error("Max retries exceeded ! Transaction not found !");
    }

    if (fetchError || !tx) {
      continue;
    }

    if (tx.request_status === "PigPurchaseApproved") {
      found = true;
      return {
        success: true,
        message: tx as txHistory,
      };
    }

  }

  return {
    success: false,
    message: "couldn't process you request, contact to support team",
  };
}
