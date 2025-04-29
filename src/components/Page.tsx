"use client";

import { backButton } from "@telegram-apps/sdk-react";
import { PropsWithChildren, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WalletGuard } from "./WalletGuard";
import Header from "./Header/Header";
import Toolbar from "./Toolbar/Toolbar";

export function Page({
  children,
  back = true,
  headerAndFooter = true,
}: PropsWithChildren<{
  /**
   * True if it is allowed to go back from this page.
   * @default true
   */
  back?: boolean;
  /**
   * True if it is allowed to show the header and footer.
   * @default true
   */
  headerAndFooter?: boolean;
}>) {
  const router = useRouter();

  useEffect(() => {
    if (back) {
      backButton.show();
    } else {
      backButton.hide();
    }
  }, [back]);

  useEffect(() => {
    return backButton.onClick(() => {
      router.back();
    });
  }, [router]);

  return (
    <WalletGuard>
      {headerAndFooter && <Header />}
      <div className="page-content">{children}</div>
      {headerAndFooter && <Toolbar />}
    </WalletGuard>
  );
}
