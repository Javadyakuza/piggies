// import { supabase } from "@/utils/supebase";
// // import { calculatePigPrice } from "./purchase/pigPrice"; // adjust import path
// import { PigLevel, PigLevels } from "@/models/pigs";

// async function updatePigPricesInTON() {
//   const tiers = [
//     { name: "bronze", level: 1 },
//     { name: "silver", level: 2 },
//     { name: "gold", level: 3 },
//     { name: "diamond", level: 4 },
//   ];

//   for (const tier of tiers) {
//     try {
//       const priceInTON = await calculatePigPrice(tier.level as PigLevel);

//       const { error } = await supabase
//         .from("appData")
//         .update({ price_in_ton: Number(priceInTON).toFixed(2) })
//         .eq("tier", tier);

//       if (error) {
//         throw new Error(`Failed to update ${tier}: ${error.message}`);
//       } else {
//         console.log(
//           `✅ Updated ${tier} to ${Number(priceInTON).toFixed(2)} TON`
//         );
//       }
//     } catch (err) {
//       throw new Error(`❌ Error updating ${tier}: ${err}`);
//     }
//   }
// }

// export function startPigPriceUpdater() {
//   // Run once immediately
//   updatePigPricesInTON();

//   // Then run every 24 hours (in milliseconds)
//   const intervalMs = 24 * 60 * 60 * 1000;

//   setInterval(() => {
//     console.log("🔁 Running 24h pig price update...");
//     updatePigPricesInTON();
//   }, intervalMs);
// }
