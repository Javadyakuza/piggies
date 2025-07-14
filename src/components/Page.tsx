"use client";

import { backButton } from "@telegram-apps/sdk-react";
import { PropsWithChildren, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header/Header";
import { Footer } from "./Footer/Footer";

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
  const pathname = usePathname();

  useEffect(() => {
    if (!backButton.isSupported() || !backButton.isMounted()) {
      return;
    }
    if (back) {
      backButton.show();
    } else {
      backButton.hide();
    }
  }, [back]);

  useEffect(() => {
    return backButton.onClick(() => {
      if (pathname === "/profile") {
        router.push("/store");
      } else {
        router.push("/profile");
      }
    });
  }, [router, pathname]);

  return (
    <>
      {headerAndFooter && <Header />}
      <div className="page-content">
        {children}
      </div>
      {headerAndFooter && <Footer />}
    </>
  );
}
