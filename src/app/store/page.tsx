/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "./styles.css";
import { Button } from "@telegram-apps/telegram-ui";
import React from "react";
import { useTonWallet } from "@tonconnect/ui-react";
import { pigsMap } from "@/utils/pigs_map";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { useSignal, initData } from "@telegram-apps/sdk-react";

type PigData = {
  pig_level: number;
  buyable_pigs: number;
};

export default function StorePage() {
  const t = useTranslations("i18n");
  const [earnings] = useState(0);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [currentPigCode, setCurrentPigCode] = useState<number | undefined>();
  const [pigsData, setPigsData] = useState<PigData>();
  const [isPurchaseInProgress, setIsPurchaseInProgress] = useState(false);

  const wallet = useTonWallet();

  const initDataState = useSignal(initData.state);
  const userTelegramId = initDataState?.user?.id;

  const items = pigsMap(t);

  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (pathname === "/store") return;
    router.push("/store");
  }, [pathname, router]);

  const fetchPigsData = async () => {
    if (!wallet) return;

    const response = await axios.get(`/api/pigs/${userTelegramId}`);
    const pigsDataToSet = response.data;
    setPigsData(pigsDataToSet);
  };

  useEffect(() => {
    fetchPigsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  useEffect(() => {
    if (!pigsData) return;
    setCurrentPigCode(pigsData.pig_level);
    const buyablePigIndex = items.findIndex(
      (item) => item.code === pigsData?.buyable_pigs
    );

    setSelectedItemIndex(buyablePigIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pigsData]);

  const handleSelectItem = (index: number) => {
    if (isPurchaseInProgress) return;
    setSelectedItemIndex(index);
  };

  const handlePurchasePig = async () => {
    if (!userTelegramId || isPurchaseInProgress) return;
    setIsPurchaseInProgress(true);
    await axios.post(`/api/pigs/upgradePig`, {
      telegram_id: userTelegramId,
    });

    await fetchPigsData();

    setIsPurchaseInProgress(false);
  };

  const activeItem =
    selectedItemIndex !== undefined && items[selectedItemIndex];

  const currentPig = currentPigCode
    ? items.find((item) => item.code === currentPigCode)
    : undefined;

  const getPurchaseButtonText = (code: number) => {
    switch (code) {
      case 1:
        return t("purchase");
      case 2:
        return t("upgradeSilver");
      case 3:
        return t("upgradeGold");
      case 4:
        return t("upgradeDiamond");
      default:
        return "";
    }
  };
  return (
    <Page>
      <div className="store-container">
        <div className="body-container">
          <div className="earnings-container">
            <h3>{t("earnings")}</h3>
            <h4>
              {t("earningsAmount", {
                amount: earnings.toLocaleString(),
                currentPigPrice: currentPig
                  ? currentPig.price.toLocaleString()
                  : 0,
              })}
            </h4>
            <Button className="withdraw-btn primary-btn">
              {t("withdraw")}
            </Button>
          </div>
          <div className="preview-container">
            <img
              src={currentPig?.coverUrl || items[0].coverUrl}
              alt="owned"
              className="main-cover"
            />
          </div>
        </div>
        <div className="footer-container">
          <div className="item-slides-container">
            {items.map((item, index) => (
              <div
                onClick={() => {
                  // if (index !== selectedItemIndex) return;
                  handleSelectItem(index);
                }}
                className={`item-slide ${
                  (index === selectedItemIndex && "--selected") || "--disabled"
                }`}
                key={`item-slide-${index}`}
              >
                {/* <div className="mask"> */}
                {/* {item.code === pigsData?.pig_level ? "Owned" : ""} */}
                {/* </div> */}
                <img
                  src={item.coverUrl}
                  alt="cover"
                  className="item-slide-cover"
                />
                {index === selectedItemIndex && <div className="badge" />}
              </div>
            ))}
          </div>
          {(activeItem && (
            <div className="active-item-details-container">
              <div className="item-slide-details-container">
                <h3>{activeItem.title}</h3>
                <h3>{t("levelNumber", { level: activeItem.levels })}</h3>
              </div>
              <div className="item-purchase-action">
                <h4>
                  {t("pigPrice", { amount: activeItem.price.toLocaleString() })}
                </h4>
                <Button
                  onClick={handlePurchasePig}
                  className="primary-btn"
                  disabled={
                    activeItem.code !== pigsData?.buyable_pigs ||
                    activeItem.code === currentPigCode ||
                    isPurchaseInProgress
                  }
                >
                  {isPurchaseInProgress
                    ? t("pleaseWait")
                    : activeItem.code !== currentPigCode
                    ? getPurchaseButtonText(activeItem.code)
                    : t("currentPig")}
                </Button>
              </div>
            </div>
          )) || <></>}
        </div>
      </div>
    </Page>
  );
}
