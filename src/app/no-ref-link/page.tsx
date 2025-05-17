"use client";

import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import Welcome from "@/components/Welcome/Welcome";

export default function NoRefLinkPage() {
  const t = useTranslations("i18n");

  const title = t("welcomePage.welcome");
  const description = t("welcomePage.referralLinkRequired");

  return (
    <Page headerAndFooter={false}>
      <Welcome title={title} description={description} />
    </Page>
  );
}
