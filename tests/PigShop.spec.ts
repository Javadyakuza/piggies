import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { Address, Dictionary, toNano } from "@ton/core";
import { loadPurchaseEvent, PigShop } from "../wrappers/PigShop";
import "@ton/test-utils";

describe("PigShop", () => {
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let user1: SandboxContract<TreasuryContract>;
  let user2: SandboxContract<TreasuryContract>;
  let admin1: SandboxContract<TreasuryContract>;
  let admin2: SandboxContract<TreasuryContract>;
  let pigShop: SandboxContract<PigShop>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    deployer = await blockchain.treasury("deployer");
    user1 = await blockchain.treasury("user1");
    user2 = await blockchain.treasury("user2");
    admin1 = await blockchain.treasury("admin1");
    admin2 = await blockchain.treasury("admin2");
    pigShop = blockchain.openContract(
      await PigShop.fromInit(deployer.getSender().address)
    );

    const deployResult = await pigShop.send(
      deployer.getSender(),
      {
        value: toNano("0.05"),
      },
      null
    );

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: pigShop.address,
      deploy: true,
      success: true,
    });
  });

  it("emits", async () => {
    let res = await pigShop.send(
      deployer.getSender(),
      {
        value: toNano("0.5"),
      },
      "UpgradePig"
    );
  });
  // console.log( res.externals, res.transactions[0]);

  // let event = loadPurchaseEvent(res.externals[0].body.asSlice());
  // let susEvent = loadPurchaseEvent(res.transactions[0].outMessages["_map"].get("n:0").body.asSlice());
  // console.log(event, susEvent)

  it("approve", async () => {
    let userBountyHunters = Dictionary.empty<Address, bigint>()
      .set(user1.address, BigInt(3))
      .set(user2.address, BigInt(2));
    let adminsShares = Dictionary.empty<Address, bigint>()
      .set(admin1.address, BigInt(2))
      .set(admin2.address, BigInt(2));
    let res = await pigShop.send(
      deployer.getSender(),
      {
        value: toNano("0.5"),
      },
      {
        $$type: "PigApproval",
        userBountyHunters,
        adminsShares,
      }
    );
    console.log(user1.address.toString(), user2.address.toString());
    console.log(res.transactions)
  });
});
