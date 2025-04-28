"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faUser } from "@fortawesome/free-solid-svg-icons";
import { usePathname, useRouter } from "next/navigation";
import "./styles.css";

export default function Toolbar() {
  const pathname = usePathname();
  const router = useRouter();

  const buttonsMap = [
    { path: "/profile", icon: faUser },
    { path: "/store", icon: faStore },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
  };
  return (
    <div className="main-toolbar-container">
      <hr />
      <div className="main-toolbar">
        {buttonsMap.map((button) => (
          <button
            className={`toolbar-btn ${pathname === button.path && "--active"}`}
            key={button.path}
            onClick={() => handleNavigate(button.path)}
          >
            <FontAwesomeIcon icon={button.icon} />
          </button>
        ))}
      </div>
    </div>
  );
}
