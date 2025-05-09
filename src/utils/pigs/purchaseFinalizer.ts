// // call the mint nft function on the contract
// import { sendTransactionToSmartContract } from './tonUtils'; // Helper to send transaction to TON contract

// const mintNFT = async (userId: string, pigId: number) => {
//   const contractAddress = 'YOUR_CONTRACT_ADDRESS';
//   const userWalletAddress = await getUserWalletAddress(userId);

//   // Call the contract to mint the NFT
//   const mintingResult = await sendTransactionToSmartContract(contractAddress, userWalletAddress, pigId);

//   if (!mintingResult.success) {
//     throw new Error('NFT minting failed');
//   }

//   console.log(`NFT minted for user ${userId} with pig ID ${pigId}`);
// };



// // update the db based on the user purchase on the following fields
// const updateDatabaseAfterPurchase = async (userId: string, pigId: number, upperUsers: string[], amount: number) => {
//     const { error } = await supabase
//       .from('users')
//       .update({
//         current_pig: pigId,
//         pig_balance: amount,
//       })
//       .eq('id', userId);
  
//     if (error) {
//       throw new Error('Error updating user data');
//     }
  
//     // Update the upper-level users' balance
//     for (const user of upperUsers) {
//       await supabase
//         .from('users')
//         .update({
//           pig_balance: user.pig_balance + 3,
//         })
//         .eq('id', user.id);
//     }
  
//     console.log('Database updated after purchase');
//   };
  
// // - the current pig
// // - the current balance in the pig of the user 
// // - the current balance of the beneficiary users(those users who got 3$ for the purchase)
