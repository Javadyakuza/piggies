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

export default function Header() {
  const initDataState = useSignal(initData.state);
  const userData = initDataState?.user;
  const t = useTranslations("i18n");
  const [isRefLinkCopied, setIsRefLinkCopied] = useState(false);

  const handleCopyRefLink = () => {
    if (isRefLinkCopied) return;
    setIsRefLinkCopied(true);
    navigator.clipboard.writeText("Sample ref link");
  };

  useEffect(() => {
    if (isRefLinkCopied) {
      setTimeout(() => {
        setIsRefLinkCopied(false);
      }, 800);
    }
  }, [isRefLinkCopied]);

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
        </div>
        <div className="ref-link">
          <Button
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
