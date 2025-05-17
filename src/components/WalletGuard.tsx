"use client";

import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Button,
  Modal,
  Placeholder,
  Spinner,
} from "@telegram-apps/telegram-ui";
import { initData, useSignal } from "@telegram-apps/sdk-react";
import axios, { AxiosError, AxiosResponse } from "axios";
import { ModalHeader } from "@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader";
import { useTranslations } from "next-intl";

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations("i18n");
  const wallet = useTonWallet();

  const [tonConnectUI] = useTonConnectUI();
  const router = useRouter();
  const pathname = usePathname();
  const [userWalletAddress, setUserWalletAddress] = useState<string | null>();
  const [isWalletChangedModalOpen, setIsWalletChangedModalOpen] =
    useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isUserRegistered, setIsUserRegistered] = useState<boolean | null>(
    null
  );

  const initDataState = useSignal(initData.state);

  const startParam = initDataState?.startParam;

  const refId = startParam?.startsWith("register_")
    ? startParam.split("_")[1]
    : null;

  const userTelegramId = initDataState?.user?.id;

  useEffect(() => {
    if (userTelegramId) {
      const fetchUserData = async () => {
        try {
          const response: AxiosResponse<{
            referral_id: string;
            wallet_address: string;
          }> = await axios.get(`/api/user-tree/${userTelegramId}`);

          if (response.data.referral_id) {
            setIsUserRegistered(true);
          }

          if (response.data.wallet_address) {
            setUserWalletAddress(response.data.wallet_address || null);
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
    if (userWalletAddress !== undefined && wallet && userTelegramId) {
      if (userWalletAddress !== wallet.account.address) {
        axios.post(`/api/user-tree/setWallet`, {
          wallet_address: wallet.account.address,
          telegram_id: userTelegramId,
        });
        setIsWalletChangedModalOpen(true);
      }
    }
  }, [userWalletAddress, wallet, userTelegramId]);

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
    } else if (refId) {
      if (pathname !== "/register") {
        router.replace("/register");
      }
      return;
    } else {
      if (pathname !== "/no-ref-link") {
        router.replace("/no-ref-link");
      }
      return;
    }

    const connected = !!wallet;

    if (connected) {
      if (pathname === "/wallet-connect") {
        router.replace("/");
      }
    } else {
      if (pathname !== "/wallet-connect") {
        router.replace("/wallet-connect");
      }
    }
  }, [initialized, wallet, pathname, router, isUserRegistered, refId]);

  if (!initialized || isUserRegistered === null) {
    return (
      <div className="root__loading">
        <Spinner size="l" />
      </div>
    );
  }

  return (
    <>
      {children}
      <Modal
        header={<ModalHeader>{t("walletAddressChanged")}</ModalHeader>}
        open={isWalletChangedModalOpen}
      >
        <Placeholder
          description={t("walletAddressChangedDescription")}
          header={t("walletAddressChanged")}
        ></Placeholder>
        <div className="warning-action-container">
          <Button
            className="modal-button"
            mode="filled"
            onClick={() => {
              setIsWalletChangedModalOpen(false);
            }}
          >
            {t("understood")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
