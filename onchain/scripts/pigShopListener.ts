import { Address } from "@ton/core";
import {KeyPair, mnemonicToPrivateKey} from "@ton/crypto";
import { TonApiClient } from "@ton-api/client";
import { loadBuyPigRequest, BuyPigRequest } from "../build/PigShop/tact_PigShop";

// import * as dotenv from 'dotenv';

const TESTNET = true;
export const client = createClient();


export function createClient(): TonApiClient {
    console.log(process.env.TONAPI_API_KEY);
    return new TonApiClient({
        baseUrl: `https://${TESTNET ? 'testnet.' : ''}tonapi.io`,
        apiKey: process.env.TONAPI_API_KEY
    }); 
  }
  
export async function keyPairFromEnv(): Promise<KeyPair> {
    const mnemonic = process.env.WALLET_MNEMONIC;
    if (!mnemonic) {
        throw new Error('WALLET_MNEMONIC is not set');
    }
    return await mnemonicToPrivateKey(mnemonic.split(' '));
}

const PIG_SHOP = Address.parse("kQDVQKProjqHsy8e6ADFMIrtKo04cJrK-bERnqshckOVVlG0");
const PURCHASE_TXS: {
    from: Address;
    hash: string;
    timestamp: number;
    amount: bigint;
    pigType: bigint;
    queryId: bigint;
}[] = [];

async function listenerBehavior(listenAddress: Address, afterLt: bigint) {
    const client = createClient();
    const transactions = await client.blockchain.getBlockchainAccountTransactions(listenAddress, {
        limit: 10,
        after_lt: afterLt,
        sort_order: 'asc',
    });
    if (transactions.transactions.length === 0) return afterLt;
    for (const tx of transactions.transactions) {
        // tx must be successful
        if (!tx.computePhase?.success || !tx.actionPhase?.success || tx.aborted) continue;
        // tx must have a body
        if (tx.inMsg?.rawBody === undefined) continue;
        // body must be a BuyPigRequest
        let buyPigRequest: BuyPigRequest;
        try {
            buyPigRequest = loadBuyPigRequest(tx.inMsg.rawBody.asSlice());
        } catch (e) {
            continue;
        }

        PURCHASE_TXS.push({
            from: tx.inMsg.source!.address,
            hash: tx.hash,
            timestamp: tx.utime,
            amount: tx.inMsg.value,
            pigType: buyPigRequest.pigType,
            queryId: buyPigRequest.queryId,
        });
    }

    // return last processed lt
    return transactions.transactions[transactions.transactions.length - 1].lt;
}

async function listenForever() {
    let lastLt = 0n;
    while (true) {
        lastLt = await listenerBehavior(PIG_SHOP, lastLt);
    }
}

async function appBehavior() {
    // send purchase message with params (queryId, pigType)
}


