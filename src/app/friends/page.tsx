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
import { pigsMap } from "@/utils/pigs_map";
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
          <div className="accordion your-refs">
            <h2 className="title">{t("friendsPage.yourReferrals")}</h2>
            <div className="arrow">
              <img src="/imgs/icons/arrow-right.png" alt="arrow-icon" />
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
