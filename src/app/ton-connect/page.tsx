"use client";

import { Page } from "@/components/Page";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { List, Placeholder, Text } from "@telegram-apps/telegram-ui";

import "./styles.css";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function TONConnectPage() {
  const t = useTranslations("i18n");
  const wallet = useTonWallet();

  if (!wallet) {
    return (
      <Page headerAndFooter={false}>
        <Placeholder
          className="ton-connect-page__placeholder"
          description={
            <>
              <Image
                src="/imgs/common/welcome.png"
                alt="tonconnect"
                width={200}
                height={200}
                className="welcome-image"
              />

              <h2 className="oink">{t("welcomePage.oink")}</h2>
              <h4 className="wallet-required">
                {t("welcomePage.walletRequired")}
              </h4>
              <TonConnectButton className="ton-connect-page__button" />
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
            <TonConnectButton className="ton-connect-page__button-connected" />
          </>
        )}
      </List>
    </Page>
  );
}
