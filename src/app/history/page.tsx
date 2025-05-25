/* eslint-disable @next/next/no-img-element */
"use client";
import React from "react";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "./styles.css";
import { pigsMapNew } from "@/utils/pigs_map";

export default function HistoryPage() {
  const t = useTranslations("i18n");

  const histories = [
    {
      id: 1,
      name: "Andrew",
      level: 1,
      pig: 2,
      date: "2023-01-01",
      balance: 3,
    },
    {
      id: 2,
      name: "Jack",
      level: 1,
      pig: 1,
      date: "2023-01-02",
      balance: 2,
    },
    {
      id: 3,
      name: "John",
      level: 2,
      pig: 3,
      date: "2023-01-03",
      balance: 1,
    },
    {
      id: 4,
      name: "Jack",
      level: 1,
      pig: 1,
      date: "2023-01-04",
      balance: 2,
    },
    {
      id: 5,
      name: "John",
      level: 2,
      pig: 3,
      date: "2023-01-05",
      balance: 1,
    },
    {
      id: 6,
      name: "Jack",
      level: 1,
      pig: 1,
      date: "2023-01-06",
      balance: 2,
    },
    {
      id: 7,
      name: "John",
      level: 2,
      pig: 3,
      date: "2023-01-07",
      balance: 1,
    },
  ];

  const emptyState = (
    <div className="empty-state-container">
      <img
        src="/imgs/icons/mag-glass.png"
        alt="empty-icon"
        className="mag-pic"
      />
      <span className="empty-text">
        <h2>{t("historiesPage.noHistories")}</h2>
      </span>
    </div>
  );

  const pigsMap = pigsMapNew(t, 0);

  const findPig = (code: number) => {
    return pigsMap.find((item) => item.code === code);
  };
  return (
    <Page>
      <div className="history-container">
        {histories.length ? (
          <>
            {histories.map((history, i) => {
              const targetPig = findPig(history.pig);
              const pigClassName = targetPig?.title
                .replace(" Pig", "")
                .toLowerCase();
              return (
                <div className="history-item" key={i}>
                  <div className="details">
                    <div className="head">
                      <h2>
                        {history.name}{" "}
                        <span className="level">
                          ({t("historiesPage.level", { level: history.level })})
                        </span>
                      </h2>
                    </div>
                    <div className="middle">
                      <h2>
                        <span className="date">{history.date}:</span>{" "}
                        <span>{t("historiesPage.got")}</span>{" "}
                        <span className={`pig-title ${pigClassName}`}>
                          {targetPig?.title}
                        </span>
                      </h2>
                    </div>
                    <div className="footer">
                      <h2>
                        {t("historiesPage.balance")}:{" "}
                        <span className="balance">+{history.balance} TON</span>
                      </h2>
                    </div>
                  </div>
                  <div className="cover">
                    <img src={targetPig?.cover} alt="pig-cover" />
                  </div>
                </div>
              );
            })}

            <h4 className="reached-end">{t("historiesPage.reachedEnd")}</h4>
            <br />
            <br />
            <br />
          </>
        ) : (
          emptyState
        )}
      </div>
    </Page>
  );
}
