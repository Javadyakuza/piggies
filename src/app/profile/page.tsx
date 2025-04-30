/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import "./styles.css";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@telegram-apps/telegram-ui";
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";

export default function ProfilePage() {
  const t = useTranslations("i18n");

  return (
    <Page>
      <div className="profile-container">
        <div className="ref-link">
          <Button className="copy-ref-link-Button primary-btn">
            <span>{t("action.copyRefLink")}</span>{" "}
            <FontAwesomeIcon icon={faCopy} size="lg" />
          </Button>
        </div>
      </div>
    </Page>
  );
}
