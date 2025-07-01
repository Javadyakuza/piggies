"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faCheck,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useSignal, initData } from "@telegram-apps/sdk-react";
import { Button, IconButton } from "@telegram-apps/telegram-ui";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios, { AxiosResponse } from "axios";
import { generateRefLink } from "@/utils/reflink";
import "./styles.css";
import { copyToClipboard } from "@/utils/copy-to-clipboard";
import { useTonConnectUI } from "@tonconnect/ui-react";
import Image from "next/image";

export default function Header() {
  const t = useTranslations("i18n");

  const router = useRouter();
  const pathname = usePathname();

  const [wallet] = useTonConnectUI();
  const walletAddress = wallet?.account?.address;

  const initDataState = useSignal(initData.state);
  const userData = initDataState?.user;

  const [isRefLinkCopied, setIsRefLinkCopied] = useState(false);
  const [referralId, setReferralId] = useState<string>();

  const handleCopyRefLink = () => {
    if (isRefLinkCopied || !referralId) return;

    setIsRefLinkCopied(true);
    copyToClipboard(generateRefLink(referralId));
  };

  useEffect(() => {
    if (isRefLinkCopied) {
      setTimeout(() => {
        setIsRefLinkCopied(false);
      }, 800);
    }
  }, [isRefLinkCopied]);

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
        throw new Error(`Error fetching user data: ${err}`);
      }
    };
    fetchUserData();
  }, [walletAddress, referralId]);

  const handleNavigateProfile = () => {
    if (pathname === "/profile") return;
    router.push("/profile");
  };

  const handleOpenStore = () => {
    if (pathname === "/store") return;
    router.push("/store");
  };

  return (
    <div className="main-header">
      <div className="profile-container">
        <div className="avatar-container">
          <div className="avatar">
            <FontAwesomeIcon icon={faUser} size="lg" />
          </div>
          <h4 className="full-name">
            {userData?.firstName} {userData?.lastName}
          </h4>
          <span style={{ fontSize: "1rem" }}> v2.9.9-prod </span>
        </div>
        <div className="actions-container">
          <div>
            <Image
              onClick={handleNavigateProfile}
              src="/imgs/icons/settings.png"
              alt="cart-icon"
              width={28}
              height={28}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
