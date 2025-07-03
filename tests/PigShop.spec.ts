import { Blockchain, EventMessageSent, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { Address, Dictionary, toNano, Cell, beginCell } from "@ton/core";
import { loadPigCreationEvent, PigShop } from "../wrappers/PigShop";
import { PigCollection } from "../wrappers/PigCollection";
import { Pig } from "../wrappers/Pig";
import "@ton/test-utils";



describe("PigCreation Event Test", () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let admin1: SandboxContract<TreasuryContract>;
    let pigShop: SandboxContract<PigShop>;
    let pigCollection: SandboxContract<PigCollection>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    deployer = await blockchain.treasury("deployer");
    user1 = await blockchain.treasury("user1");
    user2 = await blockchain.treasury("user2");
    admin1 = await blockchain.treasury("admin1");

    // 1. Deploy PigShop (Value corrected to 0.05 TON)
    pigShop = blockchain.openContract(
        await PigShop.fromInit(BigInt(1), deployer.address)
    );

    const deployShopResult = await pigShop.send(
        deployer.getSender(),
        { value: toNano("0.05") },
        null
    );

    expect(deployShopResult.transactions).toHaveTransaction({
        from: deployer.address,
        to: pigShop.address,
        deploy: true,
        success: true,
    });

    // 2. Deploy PigCollection (Value corrected to 0.05 TON)
    const collectionContent = {
        $$type: "Tep64TokenData" as const,
        flag: BigInt(1),
        content: "https://example.com/collection.json"
    };

    const royalty = {
        $$type: "RoyaltyParams" as const,
        numerator: BigInt(0), // Matched from your deploy script
        denominator: BigInt(2), // Matched from your deploy script
        destination: deployer.address
    };

    pigCollection = blockchain.openContract(
        await PigCollection.fromInit(
            deployer.address,
            pigShop.address,
            collectionContent,
            "https://example.com/nft/",
            royalty
        )
    );

    const deployCollectionResult = await pigCollection.send(
        deployer.getSender(),
        { value: toNano("0.05") },
        null
    );



    // 3. Set collection in PigShop (This part was already correct)
    const setCollectionResult = await pigShop.send(
        deployer.getSender(),
        { value: toNano("0.05") },
        {
            $$type: "ChangeCollection",
            newCollection: pigCollection.address
        }
    );

   console.log(pigShop.address.toString(), pigCollection.address.toString());
});
it("should deploy and configure contracts correctly", async () => {
    // 1. Verify PigShop's parameters
    console.log("Verifying PigShop parameters...");
    const pigShopParams = await pigShop.getGetParams();
    expect(pigShopParams.owner).toEqualAddress(deployer.address);
    expect(pigShopParams.collection).toEqualAddress(pigCollection.address);
    
    console.log("✅ PigShop configured correctly.");

    // 2. Verify PigCollection's parameters
    console.log("Verifying PigCollection parameters...");
    const collectionData = await pigCollection.getGetCollectionData();
    expect(collectionData.ownerAddress).toEqualAddress(deployer.address);
    expect(collectionData.nextItemIndex).toBe(BigInt(398));
    
    // You also need a getter in PigCollection for the pigshop address to test this part.
    // Assuming you add `get fun pigshop(): Address { return self.pigshop; }` to PigCollection.tact
    // const pigshopAddrInCollection = await pigCollection.getPigshop();
    // expect(pigshopAddrInCollection).toEqualAddress(pigShop.address);

    console.log("✅ PigCollection configured correctly.");
});


    it("should emit PigCreation event after complete pig purchase flow", async () => {
        // Step 1: Prepare PigApproval message
        const userBountyHunters = Dictionary.empty<Address, bigint>()
            .set(user1.address, toNano("0.1"));

        const adminsShares = Dictionary.empty<Address, bigint>()
            .set(admin1.address, toNano("0.02"));

        console.log("=== Starting PigApproval transaction ===");

        // Step 2: Send PigApproval to PigShop (this should trigger the entire flow)
        const approvalResult = await pigShop.send(
            deployer.getSender(),
            { value: toNano("1") }, // Sufficient gas for entire flow
            {
                $$type: "PigApproval",
                pig: null, // New pig, not upgrade
                userAddress: user1.address,
                referrerNftAddress: user2.address,
                referrerAmount: toNano("0.01"),
                userBountyHunters,
                adminsShares
            }
        );

        console.log("=== PigApproval transaction completed ===");
        console.log("Transaction count:", approvalResult.transactions.length);

        // Step 3: Verify PigApproval transaction succeeded
        expect(approvalResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: pigShop.address,
            success: true,
        });

        // Step 4: Verify MintNFT was sent to PigCollection
        expect(approvalResult.transactions).toHaveTransaction({
            from: pigShop.address,
            to: pigCollection.address,
            success: true,
        });

        // Step 5: Get the NFT address that should have been created
        const nftAddress = await pigCollection.getGetNftAddressByIndex(BigInt(398));
        console.log("Expected NFT address:", nftAddress.toString());

        // Step 6: Verify NFT was deployed and NFTTransfer was sent
        expect(approvalResult.transactions).toHaveTransaction({
            from: pigCollection.address,
            to: nftAddress,
            success: true,
        });

        // Step 7: Verify PigCreation message was sent from NFT back to PigShop
        expect(approvalResult.transactions).toHaveTransaction({
            from: nftAddress,
            to: pigShop.address,
            success: true,
        });

        
        console.log("=== Checking for PigCreation event ===");
        console.log("External messages count:", approvalResult.externals.length);
        
        
        let pigCreationEventFound = false;

        approvalResult.externals.forEach((ext, index) => {
            try {
            
            let pigCreation = loadPigCreationEvent(ext.body.asSlice())
            console.log(pigCreation);
            pigCreationEventFound = true

            } catch (e) {   }
        });

        expect(pigCreationEventFound).toBeTruthy();
        console.log("=== PigCreation event test completed successfully ===");
    });

}); 