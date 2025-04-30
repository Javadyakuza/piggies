"use client";

import { type PropsWithChildren, useEffect } from "react";
import {
  initData,
  miniApp,
  useLaunchParams,
  useSignal,
} from "@telegram-apps/sdk-react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { AppRoot, Spinner } from "@telegram-apps/telegram-ui";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorPage } from "@/components/ErrorPage";
import { useTelegramMock } from "@/hooks/useTelegramMock";
import { useDidMount } from "@/hooks/useDidMount";
import { useClientOnce } from "@/hooks/useClientOnce";
import { setLocale } from "@/core/i18n/locale";
import { init } from "@/core/init";

import "./styles.css";

export function Root({ children }: PropsWithChildren) {
  const isDev = process.env.NODE_ENV === "development";

  // Only mock in dev mode
  if (isDev) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTelegramMock();
  }

  const didMount = useDidMount();
  const lp = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);
  const debug = isDev || lp.startParam === "debug";

  useClientOnce(() => {
    init(debug);
  });

  const initDataUser = useSignal(initData.user);

  useEffect(() => {
    initDataUser && setLocale(initDataUser.languageCode);
  }, [initDataUser]);

  return (
    <TonConnectUIProvider manifestUrl="https://raw.githubusercontent.com/Javadyakuza/piggies/refs/heads/feat/development/public/tonconnect-manifest.json">
      <AppRoot
        appearance={isDark ? "dark" : "light"}
        platform={["macos", "ios"].includes(lp.platform) ? "ios" : "base"}
      >
        <ErrorBoundary fallback={ErrorPage}>
          {didMount ? (
            children
          ) : (
            <div className="root__loading">
              <Spinner size="l" />
            </div>
          )}
        </ErrorBoundary>
      </AppRoot>
    </TonConnectUIProvider>
  );
}
