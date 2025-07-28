import Image from "next/image";
import "./styles.css";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const [activePage, setActivePage] = useState(pathname);

  const t = useTranslations("i18n");
  const footerItems = [
    {
      title: t("footerContent.bank"),
      icon: "/imgs/icons/bank.png",
      link: "/",
      key: "/store",
      altKey: "/",
    },
    {
      title: t("footerContent.friends"),
      icon: "/imgs/icons/friends.png",
      link: "/",
      key: "/friends",
    },
    {
      title: t("footerContent.history"),
      icon: "/imgs/icons/history.png",
      link: "/",
      key: "/history",
    },
    {
      title: t("footerContent.collection"),
      icon: "/imgs/icons/pigs.png",
      link: "/",
      key: "/collection",
    },
  ];

  const handlePageChange = (page: string) => {
    setActivePage(page);
    router.replace(page);
  };
  return (
    <div className="main-footer-container">
      {footerItems.map((item, i) => (
        <button
          onClick={() => {
            handlePageChange(item.key);
          }}
          className={`footer-item ${
            activePage === item.key || activePage === item.altKey
              ? "--active"
              : ""
          }`}
          key={i}
        >
          <Image src={item.icon} alt={item.title} width={64} height={64} />
        </button>
      ))}
    </div>
  );
}
