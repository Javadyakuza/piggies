"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useWallet } from "@/app/context/WalletProvider";
import { User } from "../../../SupabaseTypes";
import { initData, useSignal } from "@telegram-apps/sdk-react";

type AccountContextType = {
  user: User | null;
  initDataState: ReturnType<ReturnType<typeof useSignal<(typeof initData)["state"]>>>;
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);

type AccountContextProviderProps = {
  children: ReactNode;
};

export const AccountContextProvider = ({ children }: AccountContextProviderProps) => {
  const { walletAddress } = useWallet();
  const initDataState = useSignal(initData.state);
  const [user, setUser] = useState<User | null>(null);
  const [isRegisterRequestSent, setIsRegisterRequestSent] = useState(false);

  const refId = useMemo(() => initDataState?.startParam?.startsWith("register_")
    ? initDataState.startParam.split("_")[1]
    : null,
    [initDataState?.startParam]
  );

  const userTelegramId = useMemo(() => initDataState?.user?.id, [initDataState?.user]);
  const userTelegramFullName = useMemo(() => String(initDataState?.user?.firstName || initDataState?.user?.lastName
    ? `${initDataState?.user?.firstName || ""} 
    ${initDataState?.user?.lastName || ""}`
    : initDataState?.user?.username || initDataState?.user?.id).replace(/\n/g, " "),
    [initDataState?.user]
  );

  useEffect(() => {
    if (walletAddress && userTelegramId && !isRegisterRequestSent) {
      const handleRegister = async () => {
        try {
          const response = await axios
            .patch<{ success: true, user: User } | { success: false, message: string }>(`/api/register`, {
              wallet_address: walletAddress,
              telegram_id: userTelegramId,
              referral_id: refId || "",
              fullname: userTelegramFullName,
            });
          if (!response.data.success) throw new Error(response.data.message);
          setUser(response.data.user);
        } catch (err: any) {
          console.error(err);
          return null;
        }
      };

      handleRegister();
      setIsRegisterRequestSent(true);
    }
  }, [userTelegramId, userTelegramFullName, refId, isRegisterRequestSent, walletAddress]);

  //TODO: don't try to register again if we are registered?

  useEffect(() => {
    if (!walletAddress) return;

    const fetchUserData = async () => {
      try {
        const response = await axios.get<User>(`/api/user-tree/${walletAddress}`);
        setUser(response.data);
      } catch (err) {
        throw new Error(`Error fetching user data: ${err}`);
      }
    };
    fetchUserData().catch(e => console.error(e));
  }, [walletAddress]);

  return (
    <AccountContext.Provider
      value={{
        user,
        initDataState,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) throw new Error("useAccount must be used within a AccountContextProvider");
  return context;
}
