import { PurchasePigResponse } from "@/models/purchase";
import { txHistory, TxId } from "@/models/history";
import { supabase } from "../supebase";

// export const client = createClient(); // not used yet

export async function handlePigPurchase(
  userAddress: string,
  pigLevel: 1 | 2 | 3
): Promise<PurchasePigResponse> {
  let tx_id = TxId.create(userAddress.toString(), pigLevel);
  const { data: req, error: fetchError } = await supabase
    .from("txHistory")
    .select("request_status")
    .eq("tx_id", tx_id)
    .single();

  if (fetchError) {
    console.error("Error fetching tx history:", fetchError);
  }
  if (req?.request_status && req.request_status === "PigPurchaseApproved") {
    return {
      success: true,
      message: "you've already purchased a pig",
    };
  } else if (
    req?.request_status &&
    req.request_status === "PigUpgradePending"
  ) {
    return {
      success: true,
      message: "you've already requested to upgrade your pig",
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
      .from("txHistory")
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
      return {
        success: true,
        message: tx as txHistory,
      };
    }

    found = true;
  }

  return {
    success: false,
    message: "couldn't process you request, contact to support team",
  };
}
