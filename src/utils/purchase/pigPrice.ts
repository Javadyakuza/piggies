// import { PigLevel, PigLevels } from "@/models/pigs";
// import axios from "axios";
// import { error } from "console";
// import { pigsMapV2 } from "../pigs_map";
// import { toNano } from "@ton/ton";

// export async function calculatePigPrice(pig_level: PigLevel): Promise<bigint> {
//   try {
//     const res = await axios.get(
//       `https://api.coinpaprika.com/v1/tickers/ton-toncoin`
//     );

//     const tonPriceInUSD = res?.data?.quotes?.USD.price || 0;

//     const pigsMap = pigsMapV2(undefined);

// const targetPig = pigsMap.find((pig) => pig.code === pig_level);

// const priceInUSD = targetPig?.price || 0;

// return toNano(String(targetPig?.priceInTon || "0"));
//   } catch (error) {
//     throw new Error(`Error fetching coin price ${error}`);
//   }
// }
