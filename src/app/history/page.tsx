/* eslint-disable @next/next/no-img-element */
"use client";
import React from "react";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "./styles.css";

export default function HistoryPage() {
  const t = useTranslations("i18n");

  return (
    <Page>
      <div className="history-container"></div>
    </Page>
  );
}
