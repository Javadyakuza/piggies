"use client";

import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spinner } from "@telegram-apps/telegram-ui";
import { initData, useSignal } from "@telegram-apps/sdk-react";
import axios, { AxiosError, AxiosResponse } from "axios";

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const router = useRouter();
  const pathname = usePathname();

  const [initialized, setInitialized] = useState(false);
  const [isUserRegistered, setIsUserRegistered] = useState<boolean | null>(
    null
  );

  const initDataState = useSignal(initData.state);
  const userTelegramId = initDataState?.user?.id;

  useEffect(() => {
    if (userTelegramId) {
      const fetchUserData = async () => {
        try {
          const response: AxiosResponse<{
            referral_id: string;
          }> = await axios.get(
            `/api/user-tree/${userTelegramId}`
          );

          if (response.data.referral_id) {
            setIsUserRegistered(true);
          }
        } catch (err) {
          const error = err as AxiosError;
          if (error.status === 404) setIsUserRegistered(false);
        }
      };

      fetchUserData();
    }
  }, [userTelegramId]);

  useEffect(() => {
    tonConnectUI.connectionRestored.then(() => {
      setInitialized(true);
    });
  }, [tonConnectUI]);

  useEffect(() => {
    if (!initialized || isUserRegistered === null) return;

    if (isUserRegistered) {
      if (pathname === "/register") {
        router.replace("/");
      }
    } else {
      if (pathname !== "/register") {
        router.replace("/register");
        return;
      }
      return;
    }

    const connected = !!wallet;

    if (connected) {
      if (pathname === "/ton-connect") {
        router.replace("/");
      }
    } else {
      if (pathname !== "/ton-connect") {
        router.replace("/ton-connect");
      }
    }
  }, [initialized, wallet, pathname, router, isUserRegistered]);

  if (!initialized || isUserRegistered === null) {
    return (
      <div className="root__loading">
        <Spinner size="l" />
      </div>
    );
  }

  return <>{children}</>;
}
