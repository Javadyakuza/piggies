import { PigLevel, PigLevels } from "@/models/pigs";
import axios from "axios";
import { error } from "console";
import { pigsMapNew } from "../pigs_map";

export async function calculatePigPrice(pig_level: PigLevel): Promise<number> {
  try {
    const res = await axios.get(
      `https://api.coinpaprika.com/v1/tickers/ton-toncoin`
    );

    const tonPriceInUSD = res?.data?.quotes?.USD.price || 0;

    const pigsMap = pigsMapNew(undefined, tonPriceInUSD);

    const targetPig = pigsMap.find((pig) => pig.code === pig_level);
    const priceInUSD = targetPig?.price || 0;

    return Number(targetPig?.priceInTon || 0);
  } catch (error) {
    console.error("Error fetching coin price:", error);
    throw new Error(`Error fetching coin price ${error}`);
  }
}
