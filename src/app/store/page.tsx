/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "./styles.css";
import { Button } from "@telegram-apps/telegram-ui";
import React from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { pigsMap } from "@/utils/pigs_map";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { useSignal, initData } from "@telegram-apps/sdk-react";
import { getUpgradePigTx } from "../../../scripts/upgradePig";
import { UpgradePigTx } from "@/models/purchase";
import ImageSlider from "@/components/ImageSlider/ImageSlider";

type PigData = {
  pig_level: number;
  buyable_pigs: number;
};

export default function StorePage() {
  const t = useTranslations("i18n");

  const slides = [
    {
      title: (
        <>
          <span className="normal">Buy the </span>{" "}
          <span className="bold">Bronze Pig</span>
        </>
      ),
      hint: (
        <>
          <span className="yellow">Begin journey towards the Dream</span>
        </>
      ),
      cover: "/imgs/pigs/placeholder.png",
    },
    {
      title: (
        <>
          <span className="bold">Bronze Pig</span>
        </>
      ),
      caption: (
        <>
          <span className="normal-bold">7 Levels</span>{" "}
          <span className="thick">(147 slots)</span>
        </>
      ),
      cover: "/imgs/pigs/bronze.png",
    },
    {
      title: (
        <>
          <span className="bold">Silver Pig</span>
        </>
      ),
      caption: (
        <>
          <span className="normal-bold">7 Levels</span>{" "}
          <span className="thick">(147 slots)</span>
        </>
      ),
      cover: "/imgs/pigs/silver.png",
    },
    {
      title: (
        <>
          <span className="bold">Gold Pig</span>
        </>
      ),
      caption: (
        <>
          <span className="normal-bold">7 Levels</span>{" "}
          <span className="thick">(147 slots)</span>
        </>
      ),
      cover: "/imgs/pigs/gold.png",
    },
    {
      title: (
        <>
          <span className="bold">Diamond Pig</span>
        </>
      ),
      caption: (
        <>
          <span className="normal-bold">7 Levels</span>{" "}
          <span className="thick">(147 slots)</span>
        </>
      ),
      cover: "/imgs/pigs/diamond.png",
    },
  ];

  return (
    <Page>
      <ImageSlider slides={slides} />
    </Page>
  );
  // const [earnings] = useState(0);
  // const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  // const [currentPigCode, setCurrentPigCode] = useState<number | undefined>();
  // const [pigsData, setPigsData] = useState<PigData>();
  // const [tonPrice, setTonPrice] = useState(3);
  // const [isPurchaseInProgress, setIsPurchaseInProgress] = useState(false);

  // const [wallet] = useTonConnectUI();

  // const initDataState = useSignal(initData.state);
  // const userTelegramId = initDataState?.user?.id;

  // const items = pigsMap(t);

  // const pathname = usePathname();
  // const router = useRouter();
  // useEffect(() => {
  //   if (pathname === "/store") return;
  //   router.push("/store");
  // }, [pathname, router]);

  // const fetchPigsData = async () => {
  //   if (!wallet) return;

  //   const response = await axios
  //     .get(`/api/pigs/${userTelegramId}`)
  //     .catch((err) => {
  //       console.error("Error fetching pigs data:", err);
  //       return null;
  //     });

  //   const pigsDataToSet = response?.data || undefined;
  //   setPigsData(pigsDataToSet);
  // };

  // useEffect(() => {
  //   fetchPigsData();
  //   handleTonPrice();
  //   console.log("tonPrice", tonPrice);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [wallet]);

  // useEffect(() => {
  //   if (!pigsData) return;
  //   setCurrentPigCode(pigsData.pig_level);
  //   const buyablePigIndex = items.findIndex(
  //     (item) => item.code === pigsData?.buyable_pigs
  //   );

  //   setSelectedItemIndex(buyablePigIndex);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [pigsData]);

  // const handleSelectItem = (index: number) => {
  //   if (isPurchaseInProgress) return;
  //   setSelectedItemIndex(index);
  // };

  // const handlePurchasePig = async () => {
  //   if (!userTelegramId || isPurchaseInProgress) return;
  //   let wallet_address = wallet.wallet?.account.address.toString();
  //   if (!wallet_address) {
  //     console.error("Wallet not connected");
  //     return;
  //   }

  //   let tx = await getUpgradePigTx(userTelegramId.toString());

  //   try {
  //     const result = await wallet.sendTransaction(
  //       (tx.message as UpgradePigTx).tx
  //     );

  //     console.log("Transaction sent, result:", result);

  //     alert("✅ UpgradePig transaction sent successfully!");

  //     console.log("Waiting for transaction to be confirmed...");

  //     setIsPurchaseInProgress(true);
  //     let res = await axios.post(`/api/pigs/upgradePig`, {
  //       telegram_id: userTelegramId,
  //       wallet_address,
  //     });

  //     // show the rest to the user
  //   } catch (error) {
  //     console.error("Transaction failed or was rejected:", error);

  //     alert("⚠️ Transaction was cancelled or failed.");
  //   }
  //   await fetchPigsData();

  //   setIsPurchaseInProgress(false);
  // };
  // const handleTonPrice = async () => {
  //   const res = await axios.get(
  //     `https://api.coinpaprika.com/v1/tickers/ton-toncoin`
  //   );

  //   setTonPrice(res?.data?.quotes?.USD.price.toFixed(2));
  // };

  // const activeItem =
  //   selectedItemIndex !== undefined && items[selectedItemIndex];

  // const currentPig = currentPigCode
  //   ? items.find((item) => item.code === currentPigCode)
  //   : undefined;

  // const getPurchaseButtonText = (code: number) => {
  //   switch (code) {
  //     case 1:
  //       return t("purchase");
  //     case 2:
  //       return t("upgradeSilver");
  //     case 3:
  //       return t("upgradeGold");
  //     case 4:
  //       return t("upgradeDiamond");
  //     default:
  //       return "";
  //   }
  // };
  // return (
  //   <Page>
  //     <div className="store-container">
  //       <div className="body-container">
  //         <div className="earnings-container">
  //           <h3>{t("earnings")}</h3>
  //           <h4>
  //             {t("earningsAmount", {
  //               amount: earnings.toLocaleString(),
  //               currentPigPrice: currentPig
  //                 ? currentPig.earnings.toLocaleString()
  //                 : 0,
  //             })}
  //           </h4>
  //           <Button className="withdraw-btn primary-btn">
  //             {t("withdraw")}
  //           </Button>
  //         </div>
  //         <div className="preview-container">
  //           <img
  //             src={currentPig?.coverUrl || items[0].coverUrl}
  //             alt="owned"
  //             className="main-cover"
  //           />
  //         </div>
  //       </div>
  //       <div className="footer-container">
  //         <div className="item-slides-container">
  //           {items.map((item, index) => (
  //             <div
  //               onClick={() => {
  //                 // if (index !== selectedItemIndex) return;
  //                 handleSelectItem(index);
  //               }}
  //               className={`item-slide ${
  //                 (index === selectedItemIndex && "--selected") || "--disabled"
  //               }`}
  //               key={`item-slide-${index}`}
  //             >
  //               {/* <div className="mask"> */}
  //               {/* {item.code === pigsData?.pig_level ? "Owned" : ""} */}
  //               {/* </div> */}
  //               <img
  //                 src={item.coverUrl}
  //                 alt="cover"
  //                 className="item-slide-cover"
  //               />
  //               {index === selectedItemIndex && <div className="badge" />}
  //             </div>
  //           ))}
  //         </div>
  //         {(activeItem && (
  //           <div className="active-item-details-container">
  //             <div className="item-slide-details-container">
  //               <h3>{activeItem.title}</h3>
  //               <h3
  //                 style={{
  //                   fontSize: currentPig?.code ? "1rem" : ".85rem",
  //                   paddingRight: currentPig?.code ? "0" : ".5rem",
  //                 }}
  //               >
  //                 {currentPig?.code
  //                   ? t("levelNumber", { level: activeItem.levels })
  //                   : t("firstPurchaseToUnlockLevels")}
  //               </h3>
  //             </div>
  //             <div className="item-purchase-action">
  //               <h4>
  //                 {t("pigPrice", {
  //                   amount: activeItem.price,
  //                   amountT: (activeItem.price / tonPrice).toFixed(2),
  //                 })}
  //               </h4>
  //               <Button
  //                 onClick={handlePurchasePig}
  //                 className="primary-btn"
  //                 disabled={
  //                   activeItem.code !== pigsData?.buyable_pigs ||
  //                   activeItem.code === currentPigCode ||
  //                   isPurchaseInProgress
  //                 }
  //               >
  //                 {isPurchaseInProgress
  //                   ? t("pleaseWait")
  //                   : activeItem.code !== currentPigCode
  //                     ? getPurchaseButtonText(activeItem.code)
  //                     : t("currentPig")}
  //               </Button>
  //             </div>
  //           </div>
  //         )) || <></>}
  //       </div>
  //     </div>
  //   </Page>
  // );
}
