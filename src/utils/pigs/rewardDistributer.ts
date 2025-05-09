// // get three upper users of the user 
// const getUpperUsers = async (userId: string) => {
//     const { data, error } = await supabase
//       .from('users')
//       .select('id, inviter_id')
//       .eq('id', userId);
    
//     if (error || !data || data.length === 0) {
//       throw new Error('User not found or error fetching data');
//     }
  
//     const [user] = data;
//     const upperUsers = [];
//     let currentUser = user.inviter_id;
  
//     // Get the 3 upper users (level 1, 2, 3)
//     for (let i = 0; i < 3 && currentUser; i++) {
//       const upperUserData = await supabase
//         .from('users')
//         .select('id, wallet_address')
//         .eq('id', currentUser)
//         .single();
      
//       if (upperUserData.error || !upperUserData.data) {
//         throw new Error(`Error fetching upper user at level ${i + 1}`);
//       }
  
//       upperUsers.push(upperUserData.data);
//       currentUser = upperUserData.data.inviter_id;
//     }
  
//     return upperUsers;
//   };

// // Function to send the money to the 3 upper users and developer's wallet
// const sendMoneyToUpperUsers = async (amount: number, upperUsers: { wallet_address: string }[]) => {
//     const distributionAmount = 3; // Each upper user receives $3
    
//     // Send $3 to each of the upper users
//     for (let i = 0; i < upperUsers.length; i++) {
//       await sendTransactionToWallet(upperUsers[i].wallet_address, distributionAmount);
//     }
  
//     // Calculate the remaining amount after sending $3 to each upper user
//     const remainingAmount = amount - (distributionAmount * 3);
  
//     // Send the remaining amount to the developer's wallet
//     const developerWalletAddress = 'YOUR_DEVELOPER_WALLET_ADDRESS'; // Replace with your developer wallet address
//     if (remainingAmount > 0) {
//       await sendTransactionToWallet(developerWalletAddress, remainingAmount);
//     } else {
//       console.log('No remaining balance to send to the developer.');
//     }
//   };
  
//   // Function to send transaction to a specific wallet (replace this with your blockchain interaction logic)
//   const sendTransactionToWallet = async (walletAddress: string, amount: number) => {
//     console.log(`Sending ${amount} to wallet: ${walletAddress}`);
//     // Implement actual blockchain transaction logic here (e.g., using TON or a wallet API).
//   };
  
