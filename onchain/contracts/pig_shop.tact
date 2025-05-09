message BuyPigRequest {
    queryId: Int as uint64;
    pigType: Int as uint8;
}

message PigApproval {
    queryId: Int as uint64;
    pigType: Int as uint8;
    distributeTo: map<Address, Int as coins>;
}

message Withdraw {
    queryId: Int as uint64;
    amount: Int as coins;
    to: Address;
}

contract PigShop(
    owner: Address
) {
    // Empty receiver
    // which expects the `null` message body
    receive() {
        // Forward the remaining value in the
        // incoming message back to the sender
        cashback(sender());
    }

    receive(msg: BuyPigRequest) {
        require(msg.pigType > 0 && msg.pigType <= 4, "Invalid pig type");
    }

    receive(msg: PigApproval) {
        require(sender() == self.owner, "Only owner can approve a pig purchase");
        require(!msg.distributeTo.isEmpty(), "Distribution map cannot be empty");
        foreach (address, amount in msg.distributeTo) {
            require(amount > 0, "Amount must be greater than 0");
            message(MessageParameters {
                to: address,
                value: amount,
                mode: SendPayFwdFeesSeparately
            });
        }
        // TODO: Mint NFT
        self.reply(null);
    }

    receive(msg: Withdraw) {
        require(sender() == self.owner, "Only owner can withdraw");
        require(msg.amount > ton("0.1"), "Amount must be greater than 0.1");

        
        message(MessageParameters {
            to: msg.to,
            value: msg.amount,
            mode: SendPayFwdFeesSeparately
        });

        // Send the remaining value to the owner
        self.reply(null);
    }
}
