"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import "./styles.css";
import Image from "next/image";


export default function CollectionPage() {
  const t = useTranslations("i18n");

  return (
    <Page>
        <div className="collection-container">
            <Image
                src="/imgs/common/construction.png"
                alt="Under construction"
                width={200}
                height={200}
                className="collection-image"
            />
            <h2 className="title">{t("collectionPage.oink")}</h2>
            <h4 className="description">{t("collectionPage.underDevelopment")}</h4>
        </div>
    </Page>
  );
}
