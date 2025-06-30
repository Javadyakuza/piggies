/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "./styles.css";
import { Button } from "@telegram-apps/telegram-ui";
import React from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { pigsMapV2 } from "@/utils/pigs_map";
import axios, { AxiosResponse } from "axios";
import ImageSlider from "@/components/ImageSlider/ImageSlider";
import SuggestionSlider from "@/components/SuggestionSlider/SuggestionSlider";
import ShiningImage from "@/components/ShiningImage/ShiningImage";
import { logger } from "../../../logger";
import { fromNano, Sender, SenderArguments, toNano } from "@ton/ton";
import { PigShop } from "../../../wrappers/PigShop";
import { WithdrawFromNftPig } from "../../../wrappers/Pig";
import { getTonCenterClient } from "@/utils/tonClients";
import { Address } from "@ton/core";
import {
  PurchasePigResponse,
  UpgradePigParams,
  WithdrawPigParams,
} from "@/models/purchase";

import { useSignal, initData } from "@telegram-apps/sdk-react";
import { Pig } from "../../../wrappers/Pig";
import { ContractAddresses } from "../../../scripts/constants";

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

  const initDataState = useSignal(initData.state);
  const userTelegramId = initDataState?.user?.id;

  const [wallet] = useTonConnectUI();
  const tonClient = getTonCenterClient();

  const walletAddress = wallet?.account?.address;
  const pigsMap = pigsMapV2(t, tonPrice);

  const txRequestLifetime = Date.now() + 3 * 60 * 1000; // 3 minutes for user to approve

  const handlePurchasePig = async () => {
    if (!walletAddress || isPurchaseInProgress) return;

    try {
      const sender_ = {
        send: async (args: SenderArguments) => {
          await wallet!.sendTransaction({
            messages: [
              {
                address: args.to.toString(),
                amount: args.value.toString(),
                payload: args.body?.toBoc()?.toString("base64"),
              },
            ],
            validUntil: txRequestLifetime,
          });
        },
        address: walletAddress,
      } as unknown as Sender;

      const params: AxiosResponse<PurchasePigResponse> = await axios.get(
        `/api/pigs/upgradePigParams?wallet_address=${walletAddress}`, 
        {
          timeout: 240000
        }
      );

      let pigShop = tonClient.open(
        PigShop.fromAddress(ContractAddresses.pigShop)
      );

      await pigShop.send(
        sender_,
        {
          value: BigInt((params.data.message as UpgradePigParams).amount),
        },
        (params.data.message as UpgradePigParams).operation
      );

      console.log("Transaction sent");

      alert("✅ UpgradePig transaction sent successfully!");

      console.log("Waiting for transaction to be confirmed...");

      setIsPurchaseInProgress(true);

      await axios.post(`/api/pigs/upgradePig`, {
        wallet_address: walletAddress,
        telegram_id: userTelegramId,
      });

      // show the rest to the user
    } catch (error) {
      console.error("Transaction failed or was rejected:", error);
      logger.error("Transaction failed or was rejected:", error);
      alert(`⚠️ Transaction was cancelled or failed. ${error}`);
    }
    await fetchPigsData();

    setIsPurchaseInProgress(false);
    setIsConfirmModalOpen(false);
  };

  const handleWithdrawal = async () => {
    if (!walletAddress || isPurchaseInProgress) return;

    try {
      const sender_ = {
        send: async (args: SenderArguments) => {
          console.log("args", args, args.to.toString());
          await wallet!.sendTransaction({
            messages: [
              {
                address: args.to.toString(),
                amount: toNano("0.01").toString(), // args.value.toString(),
                payload: args.body?.toBoc()?.toString("base64"),
              },
            ],
            validUntil: txRequestLifetime,
          });
        },
        address: walletAddress,
      } as unknown as Sender;

      const params: WithdrawPigParams = (
        await axios.get(
          `/api/pigs/withdrawParams?wallet_address=${walletAddress}`
        )
      ).data as WithdrawPigParams;
      
      let pig = tonClient.open(
        Pig.fromAddress(Address.parse(params.pig_address))
      );

      await pig.send(
        sender_,
        {
          value: BigInt(params.amount),
        },
        { $$type: params.operation }
      );

      console.log("withdraw Request sent");

      alert(
        `✅ Withdraw request for ${params.balance.toString()} has been sent.`
      );

      console.log("Waiting for transaction to be confirmed...");

      setIsPurchaseInProgress(true);

      // show the rest to the user
    } catch (error) {
      console.error("Transaction failed or was rejected:", error);
      logger.error("Transaction failed or was rejected:", error);
      alert(`⚠️ Transaction was cancelled or failed. ${error}`);
    }
    await fetchPigsData();

    setIsPurchaseInProgress(false);
    setIsConfirmModalOpen(false);
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
      const pgbb = response.data.piggy_bank_balance;
      setPiggyBankBalance(pgbb);
    } catch (err) {
      throw new Error(`Error fetching user data: ${err}`);
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
        <span className="slide-title bronze">{t("storePage.bronzePig")}</span>
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
    ...pigsMap.map((pigData) => {
      let titleClassName = pigData.title.replace(" Pig", "") as string;
      titleClassName = titleClassName.toLowerCase();
      return {
        title: (
          <>
            <span className={`slide-title ${titleClassName}`}>
              {pigData.title}
            </span>
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
      };
    }),
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
      nextText: (
        <>
          <div className="text">
            <h2>{t("storePage.buy")}</h2>
            <h2 className="bold bronze">{t("storePage.bronzePig")}</h2>
            <h3>{t("storePage.startEarning")}</h3>
          </div>
        </>
      ),
      buttonText: t("storePage.purchase"),
      cover: "/imgs/pigs/bronze.png",
      onClick: toggleConfirmModal,
      code: 1,
    },
    {
      nextText: (
        <>
          <div className="text">
            <h2>{t("storePage.upgradeTo")}</h2>
            <h2 className="bold silver">{t("storePage.silverPig")}</h2>
            <h3>{t("storePage.earnMore")}</h3>
          </div>
        </>
      ),
      lockedText: (
        <>
          <div className="text">
            <h2 className="bold silver">{t("storePage.silverPig")}</h2>
            <h2>
              {t("storePage.buy")}{" "}
              <span className="bold bronze">{t("storePage.bronzePig")}</span>
            </h2>
            <h3 className="small">{t("storePage.toUnlock")}</h3>
          </div>
        </>
      ),
      buttonText: t("storePage.upgrade"),
      cover: "/imgs/pigs/silver.png",
      onClick: toggleConfirmModal,
      isLocked: currentPigCode !== 1,
      code: 2,
    },
    {
      nextText: (
        <>
          <div className="text">
            <h2>{t("storePage.upgradeTo")}</h2>
            <h2 className="bold gold">{t("storePage.goldPig")}</h2>
            <h3>{t("storePage.earnMore")}</h3>
          </div>
        </>
      ),
      lockedText: (
        <>
          <div className="text">
            <h2 className="bold gold">{t("storePage.goldPig")}</h2>
            <h2>
              {t("storePage.buy")}{" "}
              <span className="bold silver">{t("storePage.silverPig")}</span>
            </h2>
            <h3 className="small">{t("storePage.toUnlock")}</h3>
          </div>
        </>
      ),
      buttonText: t("storePage.upgrade"),
      cover: "/imgs/pigs/gold.png",
      onClick: toggleConfirmModal,
      isLocked: currentPigCode !== 2,
      code: 3,
    },
    {
      nextText: (
        <>
          <div className="text">
            <h2>{t("storePage.upgradeTo")}</h2>
            <h2 className="bold diamond">{t("storePage.diamondPig")}</h2>
            <h3>{t("storePage.earnMore")}</h3>
          </div>
        </>
      ),
      lockedText: (
        <>
          <div className="text">
            <h2 className="bold diamond">{t("storePage.diamondPig")}</h2>
            <h2>
              {t("storePage.buy")}{" "}
              <span className="bold gold">{t("storePage.goldPig")}</span>
            </h2>
            <h3 className="small">{t("storePage.toUnlock")}</h3>
          </div>
        </>
      ),
      buttonText: t("storePage.upgrade"),
      cover: "/imgs/pigs/diamond.png",
      onClick: toggleConfirmModal,
      isLocked: currentPigCode !== 3,
      code: 4,
    },
  ];

  const filteredSuggestionSlides = suggestionSlides.filter(
    (slide) => slide.code > (currentPigCode || 0)
  );
  const mainPage = (
    <div className="main-container">
      <div className="balance-container">
        <div className="balance-info">
          <img src="/imgs/icons/ton.png" alt="ton-icon" className="ton-icon" />
          <span className="text">
            <h4 className="earning">{fromNano(piggyBankBalance)}</h4>{" "}
            <h4 className="total">/ {currentPig?.capacityInTon || 0} TON</h4>
          </span>
        </div>
        <Button className="withdraw-btn normal" onClick={handleWithdrawal}>
          {t("storePage.withdraw")}
        </Button>
      </div>
      <ImageSlider slides={filteredSlides} locked />
      <SuggestionSlider slides={filteredSuggestionSlides} />
      <br />
      <br />
      <br />
    </div>
  );
  let nextPigClassName = (nextPig?.title || "").replace(" Pig", "") as string;
  nextPigClassName = nextPigClassName.toLowerCase();
  const confirmModal = (
    <div className="bank-container">
      <div className="confirm-modal-container">
        <div className="title-container">
          <span className="yellow">{suggestionData.title} </span>{" "}
          <span className={`bold ${nextPigClassName}`}>{nextPig?.title}</span>
          <br />
          <span className="normal">{suggestionData.description}</span>{" "}
        </div>
        <div className="cover-container">
          {/* <img
          className="shining-image"
          src="/imgs/common/shining.png"
          alt="cover-container"
        /> */}
          <ShiningImage />
          <img className="pig-image" src={nextPig?.cover} alt="pig-cover" />
        </div>
        <div className="details-container">
          <div className="detail-item">
            <span>
              {t("storePage.numberOfLevels", { level: nextPig?.level })}
            </span>
          </div>
          <div className="detail-item">
            <span>
              {t("storePage.numberOfSlots", { slots: nextPig?.slots })}
            </span>
          </div>
          <div className="detail-item">
            <span>
              {t("storePage.tonCapacity", { capacity: nextPig?.capacityInTon })}
            </span>
          </div>
        </div>
        <div className="action-container">
          {isPurchaseInProgress ? (
            <div className="loader-container">
              <div className="loader" />
              <span>{t("storePage.transactionInProgress")}</span>
            </div>
          ) : (
            <div className="btns">
              <button
                onClick={handlePurchasePig}
                className="action-btn purchase-btn"
              >
                <div>
                  <span className="price">{nextPig?.rawPriceInTon}</span> TON
                </div>
              </button>
              <button
                onClick={toggleConfirmModal}
                className="action-btn close-btn"
              >
                <div>{t("storePage.cancel")}</div>
              </button>
            </div>
          )}
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
    <>
      {isConfirmModalOpen ? (
        confirmModal
      ) : (
        <Page back=false>
          <div className="bank-container">{mainPage}</div>
        </Page>
      )}
    </>
  );
}
