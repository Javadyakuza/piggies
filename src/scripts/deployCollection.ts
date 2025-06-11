import { toNano } from "@ton/core";
import { PigCollection, Tep64TokenData } from "../../wrappers/PigCollection";
import { NetworkProvider } from "@ton/blueprint";

// TODO: replace with metadata urls
export const tep64TokenData: Tep64TokenData = {
  $$type: 'Tep64TokenData',
  flag: BigInt('1'),
  content: 'https://',
};

export const itemPrefix = 'https://';


export async function run(provider: NetworkProvider) {
  const pigCollection = provider.open(
    await PigCollection.fromInit(provider.sender().address!, tep64TokenData, itemPrefix, {
      $$type: 'RoyaltyParams',
      numerator: 0n,
      denominator: 1n,
      destination: provider.sender().address!,
    }));

  await pigCollection.send(
    provider.sender(),
    {
      value: toNano("0.05"),
    },
    null
  );

  await provider.waitForDeploy(pigCollection.address);

  console.log(
    "PigShop contract deployed successfully at:",
    pigCollection.address.toRawString()
  );
}
