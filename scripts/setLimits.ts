import { Address, toNano } from "@ton/core";
import { PigShop } from "../wrappers/PigShop";
import { NetworkProvider } from "@ton/blueprint";
import { ContractAddresses } from "./constants";

export async function run(provider: NetworkProvider) {
  // Use the existing PigShop address from constants
  const pigShopAddress = ContractAddresses.pigShop;
  
  const pigShop = provider.open(await PigShop.fromAddress(pigShopAddress));

  console.log("Sending ChangeLimits message to PigShop at:", pigShopAddress.toRawString());

  // Send ChangeLimits message to update the limits
  // You can modify these values as needed
  await pigShop.send(
    provider.sender(),
    {
      value: toNano("0.05"),
    },
    {
      $$type: "ChangeLimits",
      level: 1n, // Level 1
      limit: toNano("0.1"), // 0.1 TON limit
    }
  );

  console.log("ChangeLimits message sent for level 1 with limit 0.1 TON");

  // Send another ChangeLimits message for level 2
  await pigShop.send(
    provider.sender(),
    {
      value: toNano("0.05"),
    },
    {
      $$type: "ChangeLimits",
      level: 2n, // Level 2
      limit: toNano("0.25"), // 0.25 TON limit
    }
  );

  console.log("ChangeLimits message sent for level 2 with limit 0.25 TON");

  // Send ChangeLimits message for level 3
  await pigShop.send(
    provider.sender(),
    {
      value: toNano("0.05"),
    },
    {
      $$type: "ChangeLimits",
      level: 3n, // Level 3
      limit: toNano("0.5"), // 0.5 TON limit
    }
  );

  console.log("ChangeLimits message sent for level 3 with limit 0.5 TON");

  // Send ChangeLimits message for level 4
  await pigShop.send(
    provider.sender(),
    {
      value: toNano("0.05"),
    },
    {
      $$type: "ChangeLimits",
      level: 4n, // Level 4
      limit: toNano("0.75"), // 0.75 TON limit
    }
  );

  console.log("ChangeLimits message sent for level 4 with limit 0.75 TON");

  console.log("All ChangeLimits messages sent successfully!");
}
