"use client";

import { Page } from "@/components/Page";
import { TonConnectButton } from "@tonconnect/ui-react";
import { List, Placeholder } from "@telegram-apps/telegram-ui";

import "./styles.css";
import Image from "next/image";

export default function Welcome({
  title,
  description,
  additionalJsx,
}: {
  title: string;
  description: string;
  additionalJsx?: React.ReactNode;
}) {
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

            <h2 className="title">{title}</h2>
            <h4 className="description">{description}</h4>
            {additionalJsx || <></>}
          </>
        }
      />
    </Page>
  );
}
