"use client";

import { Page } from "@/components/Page";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";

import { useTranslations } from "next-intl";
import Welcome from "@/components/Welcome/Welcome";

export default function WalletConnectPage() {
  const t = useTranslations("i18n");
  const wallet = useTonWallet();

  const title = t("welcomePage.oink");
  const description = t("welcomePage.walletRequired");

  return (
    <Page headerAndFooter={false}>
      {!wallet && (
        <Welcome
          title={title}
          description={description}
          additionalJsx={<TonConnectButton className="welcome-page__button" />}
        />
      )}
    </Page>
  );
}
