"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faUser } from "@fortawesome/free-solid-svg-icons";
import { useSignal, initData } from "@telegram-apps/sdk-react";
import "./styles.css";
import { TonConnectButton } from "@tonconnect/ui-react";
import { Button } from "@telegram-apps/telegram-ui";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios, { AxiosResponse } from "axios";
import { generateRefLink } from "@/utils/reflink";

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
    navigator.clipboard.writeText(generateRefLink(referralId));
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
        }> = await axios.get(
          `/api/user-tree/${userData?.id}`
        );
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
      </div>
      <hr />
    </div>
  );
}
