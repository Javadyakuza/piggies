import { toNano } from "@ton/core";

export const pigsMap = (t: any) => [
  {
    title: "Bronze Pig",
    code: 1,
    price: process.env.NEXT_PUBLIC_TESTNET ? 1 : 0.1,
    earnings: 117,
    capacity: 100,
    levels: 3,
    coverUrl: "/imgs/pigs/placeholder.png",
    iconUrl: "/pig_icons/BronzePig_icon.png",
    purchase: t("purchase"),
  },
  {
    title: "Silver Pig",
    code: 2,
    price: process.env.NEXT_PUBLIC_TESTNET ? 2 : 0.2,
    earnings: 32700,
    capacity: 250,
    levels: 7,
    coverUrl: "/imgs/pigs/bronze.png",
    iconUrl: "/pig_icons/SilverPig_icon.png",
    purchase: t("upgradeSilver"),
  },
  {
    title: "Gold Pig",
    code: 3,
    price: process.env.NEXT_PUBLIC_TESTNET ? 3 : 0.3,
    earnings: 5971510,
    capacity: 500,
    levels: 10,
    coverUrl: "/imgs/pigs/gold.png",
    iconUrl: "/pig_icons/GoldPig_icon.png",
    purchase: t("upgradeGold"),
  },
  {
    title: "Diamond Pig",
    code: 4,
    price: process.env.NEXT_PUBLIC_TESTNET ? 4 : 0.4,
    earnings: 106288200,
    capacity: 1000,
    levels: 11,
    coverUrl: "/imgs/pigs/diamond.png",
    iconUrl: "/pig_icons/DiamondPig_icon.png",
    purchase: t("upgradeDiamond"),
  },
];

const usdToTon = (usd: number, tonPrice: number) => (usd / tonPrice).toFixed(2);

export const pigsMapV2 = (t: any) => [
  {
    title: t?.("storePage.bronzePig") as string,
    className: 'bronze',
    code: 1,
    slots: 39,
    level: 3,
    cover: "/imgs/pigs/bronze.png",
  },
  {
    title: t?.("storePage.silverPig") as string,
    className: 'silver',
    code: 2,
    slots: 3279,
    level: 7,
    cover: "/imgs/pigs/silver.png",
  },
  {
    title: t?.("storePage.goldPig") as string,
    className: 'gold',
    code: 3,
    slots: 88572,
    level: 10,
    cover: "/imgs/pigs/gold.png",
  },
  {
    title: t?.("storePage.diamondPig") as string,
    className: 'diamond',
    code: 4,
    slots: 797160,
    level: 12,
    cover: "/imgs/pigs/diamond.png",
  },
];
