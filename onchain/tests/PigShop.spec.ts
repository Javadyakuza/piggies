import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { PigShop } from '../wrappers/PigShop';
import '@ton/test-utils';

describe('PigShop', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let pigShop: SandboxContract<PigShop>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        pigShop = blockchain.openContract(await PigShop.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await pigShop.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            null,
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: pigShop.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and pigShop are ready to use
    });
});
