/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import "./styles.css";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function StorePage() {
  const t = useTranslations("i18n");

  return (
    <Page>
      <div className="profile-container">
        <div className="ref-link">
          <button className="copy-ref-link-button primary-btn">
            <span>{t("action.copyRefLink")}</span>{" "}
            <FontAwesomeIcon icon={faCopy} size="lg" />
          </button>
        </div>
      </div>
    </Page>
  );
}
