/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "./styles.css";
import { Button, Spinner } from "@telegram-apps/telegram-ui";
import React from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { pigsMap, pigsMapNew } from "@/utils/pigs_map";
import { usePathname, useRouter } from "next/navigation";
import axios, { AxiosResponse } from "axios";
import { useSignal, initData } from "@telegram-apps/sdk-react";
import { getUpgradePigTx } from "../../../scripts/upgradePig";
import { UpgradePigTx } from "@/models/purchase";
import ImageSlider from "@/components/ImageSlider/ImageSlider";
import SuggestionSlider from "@/components/SuggestionSlider/SuggestionSlider";

type PigData = {
  pig_level: number;
  buyable_pigs: number;
};

export default function StorePage() {
  const t = useTranslations("i18n");
  const [piggyBankBalance, setPiggyBankBalance] = useState(0);
  const [currentPigCode, setCurrentPigCode] = useState<number | undefined>();
  const [pigsData, setPigsData] = useState<PigData>();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [tonPrice, setTonPrice] = useState(0);
  const [isPurchaseInProgress, setIsPurchaseInProgress] = useState(false);

  const [wallet] = useTonConnectUI();
  const walletAddress = wallet?.account?.address;
  const pigsMap = pigsMapNew(t, tonPrice);

  const handlePurchasePig = async () => {
    if (!walletAddress || isPurchaseInProgress) return;

    let tx = await getUpgradePigTx(walletAddress);

    try {
      const result = await wallet.sendTransaction(
        (tx.message as UpgradePigTx).tx
      );

      console.log("Transaction sent, result:", result);

      alert("✅ UpgradePig transaction sent successfully!");

      console.log("Waiting for transaction to be confirmed...");

      setIsPurchaseInProgress(true);
      await axios.post(`/api/pigs/upgradePig`, {
        wallet_address: walletAddress,
      });

      // show the rest to the user
    } catch (error) {
      console.error("Transaction failed or was rejected:", error);

      alert("⚠️ Transaction was cancelled or failed.");
    }
    await fetchPigsData();

    setIsPurchaseInProgress(false);
  };

  const fetchTonPrice = async () => {
    const res = await axios.get(
      `https://api.coinpaprika.com/v1/tickers/ton-toncoin`
    );
    const tonPriceToSet = res?.data?.quotes?.USD.price.toFixed(2);

    setTonPrice(tonPriceToSet || 0);
  };

  const fetchPigsData = async () => {
    if (!walletAddress) return;

    const response = await axios
      .get(`/api/pigs/${walletAddress}`)
      .catch((err) => {
        return null;
      });
    const pigsDataToSet = response?.data || undefined;
    setPigsData(pigsDataToSet);
  };

  const fetchUserData = async () => {
    if (!walletAddress) return;

    try {
      const response: AxiosResponse<{
        piggy_bank_balance: number;
      }> = await axios.get(`/api/user-tree/${walletAddress}`);
      const referralId = response.data.piggy_bank_balance;
      setPiggyBankBalance(referralId);
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  useEffect(() => {
    fetchPigsData();
    fetchTonPrice();
    fetchUserData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  useEffect(() => {
    if (!pigsData) return;
    setCurrentPigCode(pigsData.pig_level);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pigsData]);

  const currentPig =
    currentPigCode || currentPigCode === 0
      ? pigsMap.find((item) => item.code === currentPigCode)
      : undefined;

  const nextPig =
    currentPigCode || currentPigCode === 0
      ? pigsMap.find((item) => item.code === currentPigCode + 1)
      : undefined;

  const placeholderSlide = {
    title: (
      <span className="slide-title-container">
        <span className="thick">{t("storePage.buyThe")} </span>{" "}
        <span className="slide-title">{t("storePage.bronzePig")}</span>
      </span>
    ),
    hint: (
      <>
        <span className="yellow">{t("storePage.beginJourneyMessage")}</span>
      </>
    ),
    cover: "/imgs/pigs/placeholder.png",
    code: 0,
  };
  const slides = [
    placeholderSlide,
    ...pigsMap.map((pigData) => ({
      title: (
        <>
          <span className="slide-title">{pigData.title}</span>
        </>
      ),
      caption: (
        <>
          <span className="normal-bold">
            {t("storePage.numberOfLevels", {
              level: pigData.level,
            })}
          </span>{" "}
          <span className="thick">
            (
            {t("storePage.numberOfSlots", {
              slots: pigData.slots,
            })}
            )
          </span>
        </>
      ),
      cover: pigData.cover,
      code: pigData.code,
    })),
  ];

  const filteredSlides = slides.filter(
    (slide) =>
      (currentPigCode && slide.code >= currentPigCode) || !currentPigCode
  );

  const suggestionData = {
    title:
      nextPig?.code === 1 ? t("storePage.buyThe") : t("storePage.upgradeTo"),
    description:
      nextPig?.code === 1
        ? t("storePage.startEarning")
        : t("storePage.earnMore"),
    buttonText:
      nextPig?.code === 1 ? t("storePage.purchase") : t("storePage.upgrade"),
  };

  const toggleConfirmModal = () => {
    setIsConfirmModalOpen(!isConfirmModalOpen);
  };

  const suggestionSlides = [
    {
      title: t("storePage.buyThe"),
      pigTitle: t("storePage.bronzePig"),
      description: t("storePage.startEarning"),
      buttonText: t("storePage.purchase"),
      cover: "/imgs/pigs/bronze.png",
      onClick: toggleConfirmModal,
    },
    {
      title: t("storePage.upgradeTo"),
      pigTitle: t("storePage.silverPig"),
      description: t("storePage.earnMore"),
      buttonText: t("storePage.upgrade"),
      cover: "/imgs/pigs/silver.png",
      onClick: () => toggleConfirmModal,
    },
    {
      title: t("storePage.upgradeTo"),
      pigTitle: t("storePage.goldPig"),
      description: t("storePage.earnMore"),
      buttonText: t("storePage.upgrade"),
      cover: "/imgs/pigs/gold.png",
      onClick: () => toggleConfirmModal,
    },
    {
      title: t("storePage.upgradeTo"),
      pigTitle: t("storePage.diamondPig"),
      description: t("storePage.earnMore"),
      buttonText: t("storePage.upgrade"),
      cover: "/imgs/pigs/diamond.png",
      onClick: () => toggleConfirmModal,
    },
  ];

  const mainPage = (
    <div className="main-container">
      <div className="balance-container">
        <div className="balance-info">
          <img src="/imgs/icons/ton.png" alt="ton-icon" className="ton-icon" />
          <span className="text">
            <h4 className="earning">{piggyBankBalance}</h4>{" "}
            <h4 className="total">/ {currentPig?.capacityInTon || 0} TON</h4>
          </span>
        </div>
        <Button className="withdraw-btn normal">
          {t("storePage.withdraw")}
        </Button>
      </div>
      <ImageSlider slides={filteredSlides} locked />
      <SuggestionSlider slides={suggestionSlides} />
      {/* <div className="suggestion-container">
        <div className="text">
          <h2>{suggestionData.title}</h2>
          <h2 className="bold">{nextPig?.title}</h2>
          <h3>{suggestionData.description}</h3>
        </div>
        <div className="action">
          <img className="action-img" src={nextPig?.cover} alt="action-img" />
          <button onClick={toggleConfirmModal} className="action-btn">
            <div>{suggestionData.buttonText}</div>
          </button>
        </div>
      </div> */}
    </div>
  );

  const confirmModal = (
    <div className="confirm-modal-container">
      <div className="title-container">
        <span className="yellow">{suggestionData.title} </span>{" "}
        <span className="bold">{nextPig?.title}</span>
        <br />
        <span className="normal">{suggestionData.description}</span>{" "}
      </div>
      <div className="cover-container">
        <img
          className="shining-image"
          src="/imgs/common/shining.png"
          alt="cover-container"
        />
        <img
          className="pig-image"
          src="/imgs/pigs/bronze.png"
          alt="pig-cover"
        />
      </div>
      <div className="details-container">
        <div className="detail-item">
          <span>
            {t("storePage.numberOfLevels", { level: nextPig?.level })}
          </span>
        </div>
        <div className="detail-item">
          <span>{t("storePage.numberOfSlots", { slots: nextPig?.slots })}</span>
        </div>
        <div className="detail-item">
          <span>
            {t("storePage.tonCapacity", { capacity: nextPig?.capacityInTon })}
          </span>
        </div>
      </div>
      <div className="action-container">
        <div className="btns">
          <button
            onClick={handlePurchasePig}
            className="action-btn purchase-btn"
          >
            <div>
              <span className="price">{nextPig?.priceInTon}</span> TON
            </div>
          </button>
          <button onClick={toggleConfirmModal} className="action-btn close-btn">
            <div>{t("storePage.cancel")}</div>
          </button>
        </div>
      </div>
    </div>
  );

  // if (!pigsData)
  //   return (
  //     <div className="root__loading">
  //       <Spinner size="l" />
  //     </div>
  //   );

  return (
    <Page>
      <div className="bank-container">
        {isConfirmModalOpen ? confirmModal : mainPage}
      </div>
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
