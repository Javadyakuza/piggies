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
  const wallet = useTonWallet();

  const items = pigsMap(t);

  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (pathname === "/store") return;
    router.push("/store");
  }, [pathname, router]);

  useEffect(() => {
    if (!wallet) return;

    const fetchPigsData = async () => {
      const response = await fetch(`/api/pigs/${wallet?.account.address}`);
      const data = await response.json();
      setPigsData(data);
    };
    fetchPigsData();
  }, [wallet]);

  useEffect(() => {
    if (!pigsData) return;
    setCurrentPigCode(pigsData.pig_level);
    const buyablePigIndex = items.findIndex(
      (item) => item.code === pigsData?.buyable_pigs
    );

    setSelectedItemIndex(buyablePigIndex);
  }, [pigsData, items]);

  const handleSelectItem = (index: number) => {
    setSelectedItemIndex(index);
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
              src="https://raw.githubusercontent.com/Javadyakuza/piggies/refs/heads/feat/development/public/BronzePig.png"
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
                  if (index !== selectedItemIndex) return;
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
                <button className="primary-btn">
                  {getPurchaseButtonText(activeItem.code)}
                </button>
              </div>
            </div>
          )) || <></>}
        </div>
      </div>
    </Page>
  );
}
