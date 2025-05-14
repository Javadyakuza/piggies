import "@stdlib/deploy"; // Ensure standard library is imported

message UpgradePig {
  userAddress: Address;
}
message PigApproval {
  userBountyHunters: map<Address, Int as coins>;
  adminsShares: map<Address, Int as coins>;
}
message PigApprovalEvent {
  userAddress: Address;
  userBountyHunters: map<Address, Int as coins>;
  adminsShares: map<Address, Int as coins>;
}
message Withdraw {
  amount: Int as coins;
  to: Address;
}

contract PigShop {
  owner: Address; // Persistent state variable
  balances: map<Address, Int as coins> = emptyMap();
  // Initialize the owner in the init() function
  init(owner: Address){
    self.owner = owner;
  }

  // Empty receiver
  receive(){
    // Refund the remaining value in the incoming message back to the sender
    send(SendParameters{
        to: sender(),
        value: 0, // 0 means send no additional value
        mode: SendRemainingValue, // Sends the remaining value of the incoming message
        bounce: true
      }
    );
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
      let oldAmount = self.balances.get(address)!!;
      self.balances.set(address, oldAmount + amount);
    }
    foreach (address, amount in msg.adminsShares) {
      require(amount > 0, "Amount must be greater than 0");
      let oldAmount = self.balances.get(address)!!;
      self.balances.set(address, oldAmount + amount);
    }
    // emit the approval event
    emit(PigApprovalEvent{
        userAddress: sender(),
        userBountyHunters: msg.userBountyHunters,
        adminsShares: msg.adminsShares
      }.toCell()
    );
    // TODO: Mint NFT
    self.reply(null);
  }

  receive(msg: Withdraw){
    require(sender() == self.owner, "Only owner can withdraw");
    require(msg.amount > ton("0.1"), "Amount must be greater than 0.1");
    send(SendParameters{
        to: msg.to,
        value: msg.amount,
        mode: SendPayGasSeparately,
        bounce: true
      }
    );
    // Send the remaining value to the owner
    self.reply(null);
  }
}