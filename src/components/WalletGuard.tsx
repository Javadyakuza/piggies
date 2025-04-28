"use client";

import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const router = useRouter();
  const pathname = usePathname();

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    tonConnectUI.connectionRestored.then(() => {
      setInitialized(true);
    });
  }, [tonConnectUI]);

  useEffect(() => {
    if (!initialized) return;

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
  }, [initialized, wallet, pathname, router]);

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
