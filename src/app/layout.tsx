import type { PropsWithChildren } from "react";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { Root } from "@/components/Root/Root";
import { I18nProvider } from "@/core/i18n/provider";

import "@telegram-apps/telegram-ui/dist/styles.css";
import "normalize.css/normalize.css";
import "./_assets/globals.css";

export const metadata: Metadata = {
  title: "Piggies",
  description: "A telegram mini app",
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>
        <div className="main-container">
          <I18nProvider>
            <Root>{children}</Root>
          </I18nProvider>
        </div>
      </body>
    </html>
  );
}
