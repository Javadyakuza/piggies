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
  const initDataState = useSignal(initData.state);
  const startParam = initDataState?.startParam;
  const refId = startParam?.startsWith("register_")
    ? startParam.split("_")[1]
    : null;

  const router = useRouter();

  const [isButtonClicked, setIsButtonClicked] = useState(false);

  const userTelegramId = initDataState?.user?.id;
  const userTelegramFullName =
    initDataState?.user?.firstName || initDataState?.user?.lastName
      ? `${initDataState?.user?.firstName || ""} 
    ${initDataState?.user?.lastName || ""}`
      : initDataState?.user?.username || initDataState?.user?.id;

  const handleRegister = async () => {
    try {
      setIsButtonClicked(true);
      if (!userTelegramId) throw new Error("Telegram ID not found");
      const response = await axios.post(`/api/register`, {
        telegram_id: userTelegramId,
        referral_id: refId,
        fullname: userTelegramFullName,
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
