import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { toNano } from "@ton/core";
import { loadPurchaseEvent, PigShop } from "../wrappers/PigShop";
import "@ton/test-utils";

describe("PigShop", () => {
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let pigShop: SandboxContract<PigShop>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    deployer = await blockchain.treasury("deployer");
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
    console.log( res.externals, res.transactions[0]);  

    let event = loadPurchaseEvent(res.externals[0].body.asSlice());
    let susEvent = loadPurchaseEvent(res.transactions[0].outMessages["_map"].get("n:0").body.asSlice());
    console.log(event, susEvent)
  });
});
