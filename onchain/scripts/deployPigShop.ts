import { toNano } from '@ton/core';
import { PigShop } from '../wrappers/PigShop';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const pigShop = provider.open(await PigShop.fromInit(provider.sender().address!));

    await pigShop.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    await provider.waitForDeploy(pigShop.address);

    // run methods on `pigShop`
}
