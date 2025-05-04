"use client";

import { Page } from "@/components/Page";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { List, Placeholder, Text } from "@telegram-apps/telegram-ui";

import "./styles.css";

export default function TONConnectPage() {
  const wallet = useTonWallet();

  if (!wallet) {
    return (
      <Page headerAndFooter={false}>
        <Placeholder
          className="ton-connect-page__placeholder"
          header="TON Connect"
          description={
            <>
              <Text>
                To display the data related to the TON Connect, it is required
                to connect your wallet
              </Text>
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
