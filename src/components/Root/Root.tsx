"use client";

import { type PropsWithChildren, useEffect, useMemo } from "react";
import {
  initData,
  miniApp,
  useLaunchParams,
  useSignal,
} from "@telegram-apps/sdk-react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { AppRoot, Spinner } from "@telegram-apps/telegram-ui";

import { WalletContextProvider } from "@/app/context/WalletProvider";
import { AccountContextProvider } from "@/app/context/AccountProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorPage } from "@/components/ErrorPage";
import { useTelegramMock } from "@/hooks/useTelegramMock";
import { useDidMount } from "@/hooks/useDidMount";
import { useClientOnce } from "@/hooks/useClientOnce";
import { setLocale } from "@/core/i18n/locale";
import { init } from "@/core/init";

import "./styles.css";
import { useRouter, useSearchParams } from "next/navigation";
import { WalletGuard } from "@/components/WalletGuard";

const isDev =
  // false;
  process.env.NEXT_PUBLIC_NODE_ENV === "development";

function RootInner({ children }: PropsWithChildren) {
  const router = useRouter();
  const query = useSearchParams();
  const lp = useLaunchParams();

  const startApp = useMemo(() => query?.get("startapp"), [query]);

  useEffect(() => {
    if (startApp) {
      router.push(startApp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startApp]);

  // Mock Telegram environment in development mode if needed.
  if (isDev) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTelegramMock();
  }

  const debug = useMemo(() => isDev || lp.startParam === "debug", [lp]);

  // Initialize the library.
  useClientOnce(() => {
    init(debug);
  });

  const isDark = useSignal(miniApp.isDark);
  const initDataUser = useSignal(initData.user);

  // Set the user locale.
  useEffect(() => {
    initDataUser && setLocale(initDataUser.languageCode);
  }, [initDataUser]);

  return (
    <AppRoot
      appearance={isDark ? "dark" : "light"}
      // platform={["macos", "ios"].includes(lp.platform) ? "ios" : "base"}
      platform={"ios"}
    >
      <TonConnectUIProvider manifestUrl="https://raw.githubusercontent.com/Javadyakuza/piggies/refs/heads/feat/development/public/tonconnect-manifest.json">
        <WalletContextProvider>
          <AccountContextProvider>
            <WalletGuard>
              {children}
            </WalletGuard>
          </AccountContextProvider>
        </WalletContextProvider>
      </TonConnectUIProvider>
    </AppRoot>
  );
}

export function Root(props: PropsWithChildren) {
  // Mock Telegram environment in development mode if needed.
  if (isDev) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTelegramMock();
  }

  const didMount = useDidMount();
  const isDark = useSignal(miniApp.isDark);

  return didMount ? (
    <ErrorBoundary fallback={ErrorPage}>
      <RootInner {...props} />
    </ErrorBoundary>
  ) : (
    <div className="root__loading">
      <AppRoot
        appearance={isDark ? "dark" : "light"}
        // platform={["macos", "ios"].includes(lp.platform) ? "ios" : "base"}
        platform={"ios"}
      >
        <Spinner size="l" />
      </AppRoot>
    </div>
  );
}
