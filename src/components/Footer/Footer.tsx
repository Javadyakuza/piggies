import Image from "next/image";
import "./styles.css";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  const t = useTranslations("i18n");
  const footerItems = [
    {
      title: t("footerContent.bank"),
      icon: "/imgs/icons/bank.png",
      link: "/",
      key: "/store",
    },
    {
      title: t("footerContent.friends"),
      icon: "/imgs/icons/friends.png",
      link: "/",
      key: "/profile",
    },
    {
      title: t("footerContent.history"),
      icon: "/imgs/icons/history.png",
      link: "/",
      key: "/history",
    },
  ];
  return (
    <div className="main-footer-container">
      {footerItems.map((item, i) => (
        <div
          onClick={() => {
            router.push(item.key);
          }}
          className={`footer-item ${pathname === item.key ? "--active" : ""}`}
          key={i}
        >
          <Image src={item.icon} alt={item.title} width={24} height={24} />
          <h4>{item.title}</h4>
        </div>
      ))}
    </div>
  );
}
