#!/usr/bin/env ts-node

import {getTonCenterClient} from "@/utils/tonClients";
import {getAdminWallet} from "@/utils/admin";
import {ContractAddresses} from "./constants";
import { PigShop } from "../build/PigShop/tact_PigShop";
import {keyPairFromEnv} from "./helpers";
import {toNano} from "@ton/ton";

console.log("🚀 Starting PigShop Leftovers Withdrawer");

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

async function run() {
  const tc = getTonCenterClient();
  const adminWallet = await getAdminWallet(tc);
  const pigShop = tc.open(PigShop.fromAddress(ContractAddresses.pigShop));

  const secretKey = (await keyPairFromEnv()).secretKey;

  await pigShop.send(
    adminWallet.sender(secretKey),
    { value: toNano("0.01") },
    { $$type: 'WithdrawLeftovers' },
  );

  console.log("WithdrawLeftovers message sent.");
}

run().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
