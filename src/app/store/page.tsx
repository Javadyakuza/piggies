/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import { useState } from "react";
import "./styles.css";
import { Button, Card } from "@telegram-apps/telegram-ui";
import { CardCell } from "@telegram-apps/telegram-ui/dist/components/Blocks/Card/components/CardCell/CardCell";
import { CardChip } from "@telegram-apps/telegram-ui/dist/components/Blocks/Card/components/CardChip/CardChip";
import React from "react";

export default function StorePage() {
  const t = useTranslations("i18n");
  const balance = 4000;
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  const items = [
    {
      title: "Bronze Pig",
      price: 500,
      levels: 4,
      coverUrl: "http://localhost:3000/sample-image.png",
    },
    {
      title: "Silver Pig",
      price: 1000,
      levels: 6,
      coverUrl: "http://localhost:3000/sample-image.png",
    },
    {
      title: "Gold Pig",
      price: 1500,
      levels: 8,
      coverUrl: "http://localhost:3000/sample-image.png",
    },
    {
      title: "Diamond Pig",
      price: 2000,
      levels: 10,
      coverUrl: "http://localhost:3000/sample-image.png",
    },
  ];

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
              src="http://localhost:3000/sample-image.png"
              alt="sample"
              className="main-cover"
            />
          </div>
        </div>
        <div className="footer-container">
          <div className="item-slides-container">
            {items.map((item, index) => (
              <div
                onClick={() => handleSelectItem(index)}
                className={`item-slide ${
                  index === selectedItemIndex && "--selected"
                }`}
                key={`item-slide-${index}`}
              >
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
