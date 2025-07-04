import {
  Blockchain,
  EventMessageSent,
  SandboxContract,
  TreasuryContract,
} from "@ton/sandbox";
import {
  Address,
  Dictionary,
  toNano,
  Cell,
  beginCell,
  fromNano,
} from "@ton/core";
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
  let nftAddress1: Address;

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
      { value: toNano("1") },
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
      content: "https://example.com/collection.json",
    };

    const royalty = {
      $$type: "RoyaltyParams" as const,
      numerator: BigInt(0), // Matched from your deploy script
      denominator: BigInt(2), // Matched from your deploy script
      destination: deployer.address,
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
      { value: toNano("0.03") },
      null
    );

    // 3. Set collection in PigShop (This part was already correct)
    const setCollectionResult = await pigShop.send(
      deployer.getSender(),
      { value: toNano("0.05") },
      {
        $$type: "ChangeCollection",
        newCollection: pigCollection.address,
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

  // it("should emit PigCreation event after complete pig purchase flow", async () => {
  //   // Step 1: Prepare PigApproval message
  //   const userBountyHunters = Dictionary.empty<Address, bigint>();

  //   const adminsShares = Dictionary.empty<Address, bigint>().set(
  //     admin1.address,
  //     toNano("0.02")
  //   );

  //   console.log("=== Starting PigApproval transaction ===");

  //   // Step 2: Send PigApproval to PigShop (this should trigger the entire flow)
  //   const approvalResult = await pigShop.send(
  //     deployer.getSender(),
  //     { value: toNano("1") }, // Sufficient gas for entire flow
  //     {
  //       $$type: "PigApproval",
  //       pig: null, // New pig, not upgrade
  //       userAddress: user1.address,
  //       referrerNftAddress: admin1.address, // bounce : false, the admin will receive the share without any error
  //       referrerAmount: toNano("0.01"),
  //       userBountyHunters,
  //       adminsShares,
  //     }
  //   );

  //   console.log("=== PigApproval transaction completed ===");
  //   console.log("Transaction count:", approvalResult.transactions.length);

  //   // Step 3: Verify PigApproval transaction succeeded
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: deployer.address,
  //     to: pigShop.address,
  //     success: true,
  //   });

  //   // Step 4: Verify MintNFT was sent to PigCollection
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: pigShop.address,
  //     to: pigCollection.address,
  //     success: true,
  //   });

  //   // Step 5: Get the NFT address that should have been created
  //   const nftAddress = await pigCollection.getGetNftAddressByIndex(BigInt(398));
  //   console.log("Expected NFT address:", nftAddress.toString());

  //   // Step 6: Verify NFT was deployed and NFTTransfer was sent
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: pigCollection.address,
  //     to: nftAddress,
  //     success: true,
  //   });

  //   // Step 7: Verify PigCreation message was sent from NFT back to PigShop
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: nftAddress,
  //     to: pigShop.address,
  //     success: true,
  //   });

  //   console.log("=== Checking for PigCreation event ===");
  //   console.log("External messages count:", approvalResult.externals.length);

  //   let pigCreationEventFound = false;

  //   approvalResult.externals.forEach((ext, index) => {
  //     try {
  //       let pigCreation = loadPigCreationEvent(ext.body.asSlice());
  //       console.log(pigCreation);
  //       pigCreationEventFound = true;
  //     } catch (e) {}
  //   });

  //   expect(pigCreationEventFound).toBeTruthy();
  //   console.log("=== PigCreation event test completed successfully ===");
  // });

  // it("should confirm the bounties received from thw reward distribution and successfully do the withdrawal", async () => {
  //   // first round only admins and referrer are getting a share since there is no users having any nf t contract to receive the bounty
  //   const userBountyHunters = Dictionary.empty<Address, bigint>();

  //   const adminsShares = Dictionary.empty<Address, bigint>().set(
  //     admin1.address,
  //     toNano("0.02")
  //   );

  //   console.log("=== Starting PigApproval transaction for first user ===");

  //   // Step 2: Send PigApproval to PigShop (this should trigger the entire flow)
  //   const approvalResult = await pigShop.send(
  //     deployer.getSender(),
  //     { value: toNano("1") }, // Sufficient gas for entire flow
  //     {
  //       $$type: "PigApproval",
  //       pig: null, // New pig, not upgrade
  //       userAddress: user1.address,
  //       referrerNftAddress: admin1.address,
  //       referrerAmount: toNano("0.01"),
  //       userBountyHunters,
  //       adminsShares,
  //     }
  //   );

  //   console.log("=== PigApproval transaction completed ===");
  //   console.log("Transaction count:", approvalResult.transactions.length);

  //   // Step 3: Verify PigApproval transaction succeeded
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: deployer.address,
  //     to: pigShop.address,
  //     success: true,
  //   });

  //   // Step 4: Verify MintNFT was sent to PigCollection
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: pigShop.address,
  //     to: pigCollection.address,
  //     success: true,
  //   });

  //   // Step 5: Get the NFT address that should have been created
  //   const nftAddress = await pigCollection.getGetNftAddressByIndex(BigInt(398));
  //   console.log("Expected NFT address:", nftAddress.toString());

  //   // Step 6: Verify NFT was deployed and NFTTransfer was sent
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: pigCollection.address,
  //     to: nftAddress,
  //     success: true,
  //   });

  //   // Step 7: Verify PigCreation message was sent from NFT back to PigShop
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: nftAddress,
  //     to: pigShop.address,
  //     success: true,
  //   });

  //   console.log("=== Checking for PigCreation event ===");
  //   console.log("External messages count:", approvalResult.externals.length);

  //   let pigCreationEventFound = false;

  //   approvalResult.externals.forEach((ext, index) => {
  //     try {
  //       let pigCreation = loadPigCreationEvent(ext.body.asSlice());
  //       console.log(pigCreation);

  //       expect(pigCreation.nft).toEqualAddress(nftAddress);
  //       pigCreationEventFound = true;
  //     } catch (e) {}
  //   });

  //   expect(pigCreationEventFound).toBeTruthy();

  //   console.log(
  //     "=== PigCreation event test completed successfully for user one ==="
  //   );

  //   const userBountyHunters2 = Dictionary.empty<Address, bigint>().set(
  //     user1.address,
  //     toNano("0.05")
  //   );

  //   const adminsShares2 = Dictionary.empty<Address, bigint>().set(
  //     admin1.address,
  //     toNano("0.02")
  //   );

  //   console.log("=== Starting PigApproval transaction for user 2 ===");

  //   // Step 2: Send PigApproval to PigShop (this should trigger the entire flow)
  //   const approvalResult2 = await pigShop.send(
  //     deployer.getSender(),
  //     { value: toNano("1") }, // Sufficient gas for entire flow
  //     {
  //       $$type: "PigApproval",
  //       pig: null, // New pig, not upgrade
  //       userAddress: user2.address,
  //       referrerNftAddress: user1.address,
  //       referrerAmount: toNano("0.01"),
  //       userBountyHunters,
  //       adminsShares,
  //     }
  //   );

  //   console.log("=== PigApproval transaction completed ===");
  //   console.log("Transaction count:", approvalResult.transactions.length);

  //   // Step 3: Verify PigApproval transaction succeeded
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: deployer.address,
  //     to: pigShop.address,
  //     success: true,
  //   });

  //   // Step 4: Verify MintNFT was sent to PigCollection
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: pigShop.address,
  //     to: pigCollection.address,
  //     success: true,
  //   });

  //   // Step 5: Get the NFT address that should have been created
  //   const nftAddress2 = await pigCollection.getGetNftAddressByIndex(
  //     BigInt(399)
  //   );
  //   console.log("Expected NFT address:", nftAddress.toString());

  //   // Step 6: Verify NFT was deployed and NFTTransfer was sent
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: pigCollection.address,
  //     to: nftAddress,
  //     success: true,
  //   });

  //   // Step 7: Verify PigCreation message was sent from NFT back to PigShop
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: nftAddress,
  //     to: pigShop.address,
  //     success: true,
  //   });

  //   console.log("=== Checking for PigCreation event ===");
  //   console.log("External messages count:", approvalResult.externals.length);

  //   let pigCreationEventFound2 = false;

  //   approvalResult.externals.forEach((ext, index) => {
  //     try {
  //       let pigCreation = loadPigCreationEvent(ext.body.asSlice());
  //       console.log(pigCreation);

  //       expect(pigCreation.nft).toEqualAddress(nftAddress2);
  //       pigCreationEventFound = true;
  //     } catch (e) {}
  //   });

  //   expect(pigCreationEventFound).toBeTruthy();

  //   console.log(
  //     "=== PigCreation event test completed successfully for user one ==="
  //   );
  // });

  // it("should create the first NFT for user1", async () => {
  //   // ARRANGE: No existing NFT holders
  //   const userBountyHunters = Dictionary.empty<Address, bigint>();
  //   const adminsShares = Dictionary.empty<Address, bigint>().set(
  //     admin1.address,
  //     toNano("0.02")
  //   );

  //   // ACT: Approve the creation of the first pig for user1
  //   const approvalResult = await pigShop.send(
  //     deployer.getSender(),
  //     { value: toNano("1") },
  //     {
  //       $$type: "PigApproval",
  //       pig: null,
  //       userAddress: user1.address,
  //       referrerNftAddress: admin1.address, // Referrer can be anyone
  //       referrerAmount: toNano("0.01"),
  //       userBountyHunters,
  //       adminsShares,
  //     }
  //   );

  //   // ASSERT: Check the full transaction chain
  //   nftAddress1 = await pigCollection.getGetNftAddressByIndex(398n);
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: deployer.address,
  //     to: pigShop.address,
  //     success: true,
  //   });
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: pigShop.address,
  //     to: pigCollection.address,
  //     success: true,
  //   });
  //   expect(approvalResult.transactions).toHaveTransaction({
  //     from: pigCollection.address,
  //     to: nftAddress1,
  //     success: true,
  //   });
  //   expect(findCreationEvent(approvalResult, nftAddress1)).toBe(true);
  // });

  // it("should distribute bounty to user1 when user2 creates an NFT", async () => {
  //   // ARRANGE: Create the first NFT for user1 so they can receive a bounty
  //   // const nftAddress1 = await pigCollection.getGetNftAddressByIndex(398n);
  //   console.log("user 1 nft address", nftAddress1);
  //   await pigShop.send(
  //     deployer.getSender(),
  //     { value: toNano("1") },
  //     {
  //       $$type: "PigApproval",
  //       pig: null,
  //       userAddress: user1.address,
  //       referrerNftAddress: admin1.address,
  //       referrerAmount: toNano("0.01"),
  //       userBountyHunters: Dictionary.empty(),
  //       adminsShares: Dictionary.empty<Address, bigint>().set(
  //         admin1.address,
  //         toNano("0.02")
  //       ),
  //     }
  //   );

  //   // ARRANGE: Now, user1 is an existing NFT holder who should receive a bounty
  //   const userBountyHunters = Dictionary.empty<Address, bigint>().set(
  //     nftAddress1,
  //     toNano("0.05")
  //   );
  //   const adminsShares = Dictionary.empty<Address, bigint>().set(
  //     admin1.address,
  //     toNano("0.02")
  //   );

  //   // ACT: Approve the creation of a second pig for user2
  //   const approvalResult2 = await pigShop.send(
  //     deployer.getSender(),
  //     { value: toNano("1") },
  //     {
  //       $$type: "PigApproval",
  //       pig: null,
  //       userAddress: user2.address,
  //       referrerNftAddress: nftAddress1, // user1's NFT is the referrer
  //       referrerAmount: toNano("0.01"),
  //       userBountyHunters,
  //       adminsShares,
  //     }
  //   );

  //   // ASSERT: Check that the bounty was sent to user1's NFT
  //   expect(approvalResult2.transactions).toHaveTransaction({
  //     from: pigShop.address,
  //     to: nftAddress1,
  //     op: 1004, // op-code for PigBounty
  //     success: true,
  //     value: toNano("0.05"), // The bounty amount
  //   });

  //   // Also confirm the second NFT was created for user2
  //   const nftAddress2 = await pigCollection.getGetNftAddressByIndex(399n);
  //   expect(findCreationEvent(approvalResult2, nftAddress2)).toBe(true);
  // });

  it("should allow user1 to withdraw their accumulated bounty", async () => {
    // ARRANGE: Create an NFT for user1 and fund it with a bounty

    // Create user1's NFT
    let rs = await pigShop.send(
      deployer.getSender(),
      { value: toNano("1") },
      {
        $$type: "PigApproval",
        pig: null,
        userAddress: user1.address,
        referrerNftAddress: admin1.address,
        referrerAmount: toNano("0.01"),
        userBountyHunters: Dictionary.empty<Address, bigint>(),
        adminsShares: Dictionary.empty<Address, bigint>().set(
          admin1.address,
          toNano("0.02")
        ),
      }
    );

    const nftAddress1 = await pigCollection.getGetNftAddressByIndex(
      BigInt(398)
    );

    const pigNft1 = blockchain.openContract(Pig.fromAddress(nftAddress1));
    const nftBalanceBeforeBef = (await blockchain.getContract(nftAddress1)).balance;
    console.log(
      "NFT Balance before funding:",
      nftBalanceBeforeBef
    );
    // Fund user1's NFT by creating a second NFT and sending bounty to user1
    const bountyAmount = toNano("0.4");
    await pigShop.send(
      deployer.getSender(),
      { value: toNano("2") },
      {
        $$type: "PigApproval",
        pig: null,
        userAddress: user2.address,
        referrerNftAddress: nftAddress1,
        referrerAmount: toNano("0.01"),
        userBountyHunters: Dictionary.empty<Address, bigint>().set(
          nftAddress1,
          bountyAmount
        ),
        adminsShares: Dictionary.empty<Address, bigint>().set(
          admin1.address,
          toNano("0.01")
        ),
      }
    );

    // const nftBalanceBefore = (await blockchain.getContract(nftAddress1))
    //   .balance;
    const nftBalanceBeforeAft = (await blockchain.getContract(nftAddress1)).balance;
    console.log("NFT Balance before withdrawal:", nftBalanceBeforeAft);
    expect(nftBalanceBeforeAft).toBeGreaterThan(bountyAmount);

    // ACT: user1 sends a withdrawal message to their NFT
    const withdrawResult = await pigNft1.send(
      user1.getSender(),
      { value: toNano("0.1") },
      { $$type: "WithdrawFromNftPig" }
    );

    // ASSERT:
    // 1. The NFT successfully sent the funds to the owner (user1)
    expect(withdrawResult.transactions).toHaveTransaction({
      from: nftAddress1,
      to: user1.address,
      success: true,
    });

    // 2. The PigShop received the notification and emitted the correct event
    expect(withdrawResult.transactions).toHaveTransaction({
      from: nftAddress1,
      to: pigShop.address,
      op: 2002, // op-code for WithdrawFromPig
      success: true,
    });

    // (Optional but recommended) Check for the WithdrawFromPigEvent from the PigShop
    // This requires a loader function and op-code for the event, similar to PigCreationEvent.
  });
});
