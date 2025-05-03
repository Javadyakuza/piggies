/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "./styles.css";
import { Button, Card } from "@telegram-apps/telegram-ui";
import React from "react";
import { useTonWallet } from "@tonconnect/ui-react";
import axios from "axios";
import { pigsMap } from "@/utils/pigs_map";

type PigData = {
  pig_levels: number;
  buyable_pigs: number;
};

export default function StorePage() {
  const t = useTranslations("i18n");
  const [balance, setBalance] = useState(0);
  const [isBalanceSet, setIsBalanceSet] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [pigsData, setPigsData] = useState<PigData>();
  const wallet = useTonWallet();

  const items = pigsMap(t);

  useEffect(() => {
    if (!wallet) return;
    setIsBalanceSet(false);

    const fetchPigsData = async () => {
      const response = await fetch(`/api/pigs/${wallet?.account.address}`);
      const data = await response.json();
      setPigsData(data);
    };
    fetchPigsData();
  }, [wallet]);

  useEffect(() => {
    if (isBalanceSet) return;
    if (balance == 0 && wallet) {
      getTonBalance(wallet?.account.address).then((res) => setBalance(res));
    }
    setSelectedItemIndex(pigsData?.buyable_pigs || 0);
    setIsBalanceSet(true);
  }, [pigsData, wallet, balance, isBalanceSet]);

  const getTonBalance = async (address: string): Promise<number> => {
    const response = await axios.get(
      `https://toncenter.com/api/v2/getAddressBalance`,
      {
        params: {
          address,
        },
      }
    );

    const rawBalance = response.data.result;
    const tonBalance = Number(rawBalance) / 1e9;

    return Number(tonBalance.toFixed(2));
  };
  const handleSelectItem = (index: number) => {
    setSelectedItemIndex(index);
  };

  const activeItem =
    selectedItemIndex !== undefined && items[selectedItemIndex];

  return (
    <Page>
      <div className="store-container">
        <div className="body-container">
          <div className="balance-container">
            <h3>{t("balance")}</h3>
            <h4>{t("balanceAmount", { amount: balance })}</h4>
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
                {/* {item.code === pigsData?.pig_levels ? "Owned" : ""} */}
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
                <h4>{t("balanceAmount", { amount: activeItem.price })}</h4>
                <button className="primary-btn">{t("purchase")}</button>
              </div>
            </div>
          )) || <></>}
        </div>
      </div>
    </Page>
  );
}
