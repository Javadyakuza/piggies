import { PigLevel, PigLevels } from "@/models/pigs";
import axios from "axios";
import { error } from "console";
import { pigsPriceMap } from "../pigs_map";

export async function calculatePigPrice(pig_level: PigLevel): Promise<number> {
  try {
    const res = await axios.get(
      `https://api.coinpaprika.com/v1/tickers/ton-toncoin`
    );

    let tonPriceInUSD = res?.data?.quotes?.USD.price;

    let priceInUSD = pigsPriceMap[(pig_level).toString()];

    // calculate USDs in ton
    return priceInUSD / tonPriceInUSD;
  } catch (error) {
    console.error("Error fetching coin price:", error);
    throw new Error(`Error fetching coin price ${error}`);
  }
}
