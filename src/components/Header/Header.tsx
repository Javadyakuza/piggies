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

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const initDataState = useSignal(initData.state);
  const userData = initDataState?.user;
  const t = useTranslations("i18n");

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
    if (!userData?.id && referralId) return;

    const fetchUserData = async () => {
      try {
        const response: AxiosResponse<{
          referral_id: string;
        }> = await axios.get(`/api/user-tree/${userData?.id}`);
        const referralId = response.data.referral_id;
        setReferralId(referralId);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [userData, referralId]);

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
        <div className="avatar-container" onClick={handleNavigateProfile}>
          <div className="avatar">
            <FontAwesomeIcon icon={faUser} size="lg" />
          </div>
          <h4 className="full-name">
            {userData?.firstName} {userData?.lastName}
          </h4>
        </div>
        <div className="actions-container">
          <div className="ref-link">
            <Button
              disabled={!referralId}
              onClick={handleCopyRefLink}
              className="copy-ref-link-Button primary-btn"
            >
              <span>
                {isRefLinkCopied ? t("refLinkCopied") : t("action.copyRefLink")}
              </span>{" "}
              <FontAwesomeIcon
                icon={isRefLinkCopied ? faCheck : faCopy}
                size="lg"
              />
            </Button>
          </div>
          <IconButton mode="plain" onClick={handleOpenStore}>
            <FontAwesomeIcon icon={faCartShopping} size="lg" />
          </IconButton>
        </div>
      </div>
      <hr />
    </div>
  );
}
