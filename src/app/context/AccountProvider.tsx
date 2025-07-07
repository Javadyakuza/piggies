"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
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
