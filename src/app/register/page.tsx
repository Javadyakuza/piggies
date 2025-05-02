/* eslint-disable @next/next/no-img-element */
"use client";

import { Page } from "@/components/Page";
import "./styles.css";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Title } from "@telegram-apps/telegram-ui";
import { useTranslations } from "next-intl";
import axios from "axios";
import { useSignal, initData } from "@telegram-apps/sdk-react";
import { useState } from "react";

export default function RegisterPage() {
  const t = useTranslations("i18n");
  const query = useSearchParams();
  const refId = query?.get("refId");

  const router = useRouter();

  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const initDataState = useSignal(initData.state);
  const userTelegramId = initDataState?.user?.id;

  const handleRegister = async () => {
    try {
      setIsButtonClicked(true);
      if (!userTelegramId) throw new Error("Telegram ID not found");
      const response = await axios.post(`http://localhost:3000/api/register`, {
        telegram_id: userTelegramId,
        referral_id: refId,
      });
      if (response.status === 201) {
        router.push("/ton-connect");
      }
    } catch (error) {
      setIsButtonClicked(false);
      console.error("Error registering user:", error);
    }
  };
  return (
    <Page headerAndFooter={false}>
      <div className="register-container">
        {refId ? (
          <>
            <Title level="1" weight="2">
              {t("welcome")}
            </Title>
            <br />
            <Button
              disabled={isButtonClicked}
              onClick={handleRegister}
              mode="filled"
              size="l"
            >
              {isButtonClicked ? t("pleaseWait") : t("register")}
            </Button>
          </>
        ) : (
          <>
            <Title level="1" weight="2">
              {t("pleaseJoinViaReferralLink")}
            </Title>
            <br />
            <Title level="2" weight="1">
              {t("canNotRegisterWithoutReferral")}
            </Title>
          </>
        )}
      </div>
    </Page>
  );
}
