import "@stdlib/deploy"; // Ensure standard library is imported
import "./messages.tact";

message UpgradePig {
  userAddress: Address;
}
message PigApproval {
  userAddress: Address;
  userBountyHunters: map<Address, Int as coins>;
  adminsShares: map<Address, Int as coins>;
}
message PigApprovalEvent {
  userAddress: Address;
  userBountyHunters: map<Address, Int as coins>;
  adminsShares: map<Address, Int as coins>;
}



contract PigShop {
  collection: Address;
  owner: Address;
  limits: map<Int as uint8, Int as coins> = emptyMap();
  // Initialize the owner in the init() function
  init(owner: Address, collection: Address) {
    self.owner = owner;
    self.collection = collection;
    self.limits.set(1, ton("0.1"));
    self.limits.set(2, ton("0.25"));
    self.limits.set(3, ton("0.5"));
    self.limits.set(4, ton("0.75"));
  }

  // Empty receiver
  receive(){
    // Refund the remaining value in the incoming message back to the sender
    // send(SendParameters{
    //     to: sender(),
    //     value: 0, // 0 means send no additional value
    //     mode: SendRemainingValue, // Sends the remaining value of the incoming message
    //     bounce: true
    //   }
    // );
  }

  receive("UpgradePig"){
    emit(UpgradePig{userAddress: sender()}.toCell());
  }

  receive(msg: PigApproval){
    require(sender() == self.owner, "Only owner can approve a pig purchase");
    require(!msg.userBountyHunters.isEmpty() && !msg.adminsShares.isEmpty(),
      "Distribution map cannot be empty"
    );
    // updating the user balances
    foreach (address, amount in msg.userBountyHunters) {
      require(amount > 0, "Amount must be greater than 0");
      send(SendParameters {
        to: address,
        value: amount,
        mode: SendPayGasSeparately,
        bounce: true,
        body: PigBounty {
          limits: self.limits,
          surplusDestination: self.owner
        }.toCell()
      });
    }
    foreach (address, amount in msg.adminsShares) {
      require(amount > 0, "Amount must be greater than 0");
      send(SendParameters {
        to: address,
        value: amount,
        mode: SendPayGasSeparately,
        bounce: false,
      });
    }

    send(SendParameters {
      to: self.collection,
      value: ton("0.1"),
      mode: SendPayGasSeparately,
      bounce: false,
    });
    // emit the approval event
    emit(PigApprovalEvent{
        userAddress: msg.userAddress,
        userBountyHunters: msg.userBountyHunters,
        adminsShares: msg.adminsShares
      }.toCell()
    );
  }
}