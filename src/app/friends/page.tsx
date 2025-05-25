/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import "./styles.css";
import {
  faCheck,
  faCopy,
  faSignOut,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Accordion, Button, IconButton } from "@telegram-apps/telegram-ui";
import { DisplayData } from "@/components/DisplayData/DisplayData";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { AccordionContent } from "@telegram-apps/telegram-ui/dist/components/Blocks/Accordion/components/AccordionContent/AccordionContent";
import { AccordionSummary } from "@telegram-apps/telegram-ui/dist/components/Blocks/Accordion/components/AccordionSummary/AccordionSummary";
import { pigsMap, pigsMapNew } from "@/utils/pigs_map";
import { useSignal, initData } from "@telegram-apps/sdk-react";
import { copyToClipboard } from "@/utils/copy-to-clipboard";
import { generateRefLink } from "@/utils/reflink";

type PigData = {
  pig_level: number;
  buyable_pigs: number;
};

export default function FriendsPage() {
  const t = useTranslations("i18n");
  const [referralId, setReferralId] = useState("");
  const [openedAccordion, setOpenedAccordion] = useState<
    "ref" | number | undefined
  >();

  const wallet = useTonWallet();
  const walletAddress = wallet?.account?.address;

  const truncate = (str: string, maxLength: number) => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + "...";
  };

  useEffect(() => {
    if (!walletAddress && referralId) return;

    const fetchUserData = async () => {
      try {
        const response: AxiosResponse<{
          referral_id: string;
        }> = await axios.get(`/api/user-tree/${walletAddress}`);
        const referralId = response.data.referral_id;
        setReferralId(referralId);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [walletAddress, referralId]);

  const refLink = generateRefLink(referralId);

  const handleCopyAddress = () => {
    copyToClipboard(refLink);
  };
  const toggleRefAccordion = () => {
    setOpenedAccordion(openedAccordion === "ref" ? undefined : "ref");
  };

  const pigsMap = pigsMapNew(t, 0);

  const levels = 3; // mock
  const invites = [
    // mock
    {
      id: 1,
      name: "Andrew",
      level: 1,
      pig: 2,
    },
    {
      id: 2,
      name: "Jack",
      level: 1,
      pig: 1,
    },
    {
      id: 3,
      name: "John",
      level: 2,
      pig: 3,
    },
  ];

  const lockedLevels = [4, 7];

  const toggleLevelAccordion = (level: number) => {
    setOpenedAccordion(openedAccordion === level ? undefined : level);
  };

  const EmptyState = (
    <div className="empty-container">
      <span className="empty">You should invite someone</span>
    </div>
  );

  const findPig = (code: number) => {
    return pigsMap.find((item) => item.code === code);
  };
  const RefAccordionContent = () => {
    return (
      <div className="ref-accordion-content">
        {invites.length ? (
          <div className="invites-container">
            {invites.map((invite, i) => {
              const targetPig = findPig(invite.pig);
              const pigClassName = targetPig?.title
                .replace(" Pig", "")
                .toLowerCase();
              return (
                <div className="invite-item" key={i}>
                  <div className="details">
                    <div className="head">
                      <h2>
                        {invite.name}{" "}
                        <span className="level">
                          (
                          {t("friendsPage.levelReferrals", {
                            level: invite.level,
                          })}
                          )
                        </span>
                      </h2>
                    </div>
                    <div className="footer">
                      <h5 className={pigClassName}>{targetPig?.title}</h5>
                    </div>
                  </div>
                  <div className="pig-pic">
                    <img src={targetPig?.cover} alt="pig-cover" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          EmptyState
        )}
      </div>
    );
  };

  const LevelAccordionContent = () => {
    return (
      <div className="level-accordion-content">
        <h3 className="slots">
          {t("friendsPage.slots", {
            current: 1,
            total: 2,
          })}
        </h3>
        <h3 className="bronze">
          {t("friendsPage.bronzePigs", { number: 1 })}
          <span className="your-refs">
            {" "}
            ({t("friendsPage.yourRefs", { number: 1 })})
          </span>
        </h3>
        <h3 className="silver">
          {t("friendsPage.silverPigs", { number: 1 })}
          <span className="your-refs">
            {" "}
            ({t("friendsPage.yourRefs", { number: 1 })})
          </span>
        </h3>
        <h3 className="gold">
          {t("friendsPage.goldPigs", { number: 1 })}
          <span className="your-refs">
            {" "}
            ({t("friendsPage.yourRefs", { number: 1 })})
          </span>
        </h3>
        <h3 className="diamond">
          {t("friendsPage.diamondPigs", { number: 1 })}
          <span className="your-refs">
            {" "}
            ({t("friendsPage.yourRefs", { number: 1 })})
          </span>
        </h3>
      </div>
    );
  };

  return (
    <Page>
      <div className="friends-container">
        <div className="invite-container">
          <h3 className="title">{t("friendsPage.title")}</h3>
          <div className="invite-link">
            <h3 className="link">{truncate(refLink, 25)}</h3>
            <button className="copy-btn">
              <img
                src="/imgs/icons/copy.png"
                alt="copy-icon"
                onClick={handleCopyAddress}
              />
            </button>
          </div>
          <p className="hint">{t("friendsPage.hint")}</p>
        </div>
        <div className="accordion-container">
          <div onClick={toggleRefAccordion} className="accordion your-refs">
            <h2 className="title">{t("friendsPage.yourReferrals")}</h2>
            <div
              className={`arrow ${openedAccordion === "ref" ? "--open" : ""}`}
            >
              <img src="/imgs/icons/arrow-right.png" alt="arrow-icon" />
            </div>
          </div>
          {openedAccordion === "ref" && <RefAccordionContent />}
          {Array.from({ length: levels }).map((_, i) => {
            const level = i + 1;
            return (
              <>
                <div
                  onClick={() => toggleLevelAccordion(level)}
                  className="accordion level"
                  key={i}
                >
                  <h2 className="title">
                    {t("friendsPage.levelReferrals", { level })}
                  </h2>
                  <div
                    className={`arrow ${openedAccordion === level ? "--open" : ""}`}
                  >
                    <img src="/imgs/icons/arrow-right.png" alt="arrow-icon" />
                  </div>
                </div>
                {openedAccordion === level && <LevelAccordionContent />}
              </>
            );
          })}
          <div className="accordion level locked">
            <div className="locked-title">
              <h2 className="title ">
                {t("friendsPage.levelReferrals", {
                  level: lockedLevels.join(" - "),
                })}
              </h2>
              <img
                className="locked-img"
                src="/imgs/icons/locked.png"
                alt="locked"
              />
            </div>
            <div className="arrow">
              <img src="/imgs/icons/arrow-right-bright.png" alt="arrow-icon" />
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
