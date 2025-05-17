"use client";

import { Page } from "@/components/Page";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { List, Placeholder, Text } from "@telegram-apps/telegram-ui";

import "./styles.css";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

export default function TONConnectPage() {
  const t = useTranslations("i18n");
  const wallet = useTonWallet();
  const query = useSearchParams();
  const isUnRegisteredUserRedirectedToWelcome = query?.get("noref") === "true";

  const pagesMap = {
    walletConnect: {
      title: t("welcomePage.oink"),
      description: t("welcomePage.walletRequired"),
    },
    register: {
      title: t("welcomePage.welcome"),
      description: t("welcomePage.referralLinkRequired"),
    },
  };

  const pageKey = isUnRegisteredUserRedirectedToWelcome
    ? "register"
    : "walletConnect";

  const currentPage = pagesMap[pageKey];

  if (!wallet) {
    return (
      <Page headerAndFooter={false}>
        <Placeholder
          className="welcome-page__placeholder"
          description={
            <>
              <Image
                src="/imgs/common/welcome.png"
                alt="welcome"
                width={200}
                height={200}
                className="welcome-image"
              />

              <h2 className="title">{currentPage.title}</h2>
              <h4 className="description">{currentPage.description}</h4>
              {pageKey === "walletConnect" && (
                <TonConnectButton className="welcome-page__button" />
              )}
            </>
          }
        />
      </Page>
    );
  }

  return (
    <Page>
      <List>
        {"imageUrl" in wallet && (
          <>
            <TonConnectButton className="welcome-page__button-connected" />
          </>
        )}
      </List>
    </Page>
  );
}
