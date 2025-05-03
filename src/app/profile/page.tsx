/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import "./styles.css";
import { faCheck, faCopy, faSignOut } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Accordion,
  Button,
  Chip,
  IconButton,
} from "@telegram-apps/telegram-ui";
import { DisplayData } from "@/components/DisplayData/DisplayData";
import {
  TonConnectButton,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { AccordionContent } from "@telegram-apps/telegram-ui/dist/components/Blocks/Accordion/components/AccordionContent/AccordionContent";
import { AccordionSummary } from "@telegram-apps/telegram-ui/dist/components/Blocks/Accordion/components/AccordionSummary/AccordionSummary";
import { pigsMap } from "@/utils/pigs_map";

export default function ProfilePage() {
  const t = useTranslations("i18n");
  const wallet = useTonWallet();
  const pigs = pigsMap(t);

  const findPig = (targetCode: number) =>
    pigs.find((pig) => pig.code === targetCode);

  const [tonConnectUI] = useTonConnectUI();

  const pathname = usePathname();
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [isBalanceSet, setIsBalanceSet] = useState(false);
  const [isAddressCopied, setIsAddressCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [referrals, setReferrals] = useState<
    Record<
      string,
      {
        count: number;
        total: number;
        users: {
          telegram_id: string;
          wallet_address: string;
          current_pig: number;
        }[];
      }
    >
  >({});
  const [isDisconnectConfirmVisible, setIsDisconnectConfirmVisible] =
    useState(false);
  const [expandedLevel, setExpandedLevel] = useState("");

  const handleDisconnectWallet = () => {
    if (isDisconnectConfirmVisible) tonConnectUI.disconnect();
    else {
      setIsDisconnectConfirmVisible(true);
    }
  };

  useEffect(() => {
    if (pathname === "/profile") return;
    router.push("/profile");
  }, [pathname, router]);

  useEffect(() => {
    if (isDisconnectConfirmVisible) {
      setTimeout(() => {
        setIsDisconnectConfirmVisible(false);
      }, 1300);
    }
  }, [isDisconnectConfirmVisible]);

  const getTonBalance = async (address: string): Promise<number> => {
    const response = await axios.get(
      `https://toncenter.com/api/v2/getAddressBalance`,
      {
        params: {
          address,
        },
      }
    );

    const rawBalance = response.data.result;
    const tonBalance = Number(rawBalance) / 1e9;

    return Number(tonBalance.toFixed(2));
  };

  useEffect(() => {
    if (isBalanceSet) return;
    if (wallet && balance === 0) {
      getTonBalance(wallet?.account.address).then((res) => setBalance(res));
    }
    setIsBalanceSet(true);
  }, [wallet, balance, isBalanceSet]);

  useEffect(() => {
    if (wallet) {
      setWalletAddress(wallet?.account.address);

      const fetchReferrals = async () => {
        const telegramId = "admin";
        const referrals = 8;
        const response = await fetch(
          `/api/user-tree/${telegramId}/${referrals}`
        );
        const data = await response.json();
        setReferrals(data);
      };
      fetchReferrals();
    }
  }, [wallet]);

  useEffect(() => {
    if (isAddressCopied) {
      setTimeout(() => {
        setIsAddressCopied(false);
      }, 600);
    }
  }, [isAddressCopied]);

  const handleCopyAddress = () => {
    if (isAddressCopied) return;
    setIsAddressCopied(true);
    navigator.clipboard.writeText(walletAddress);
  };

  const handleReferralLevelClick = (level: string) => {
    console.log(expandedLevel, level);
    if (expandedLevel === level) setExpandedLevel("");
    else setExpandedLevel(level);
  };

  const prepareReferrals = () => {
    const levels = Object.keys(referrals);

    return levels.map((level) => {
      const referralData = referrals[level];
      const levelNumber = level.replace("level_", "");
      return {
        title: t("levelReferrals", { level: levelNumber }),
        value: (
          <div className="referral-accordion">
            <Accordion
              onChange={() => handleReferralLevelClick(level)}
              expanded={expandedLevel === level}
            >
              <AccordionSummary>
                {`${referralData.count}/${referralData.total}`}
              </AccordionSummary>
              <AccordionContent>
                <div className="user-cards-container">
                  {referralData.users.map((user) => (
                    <div className="user-card" key={user.telegram_id}>
                      <h4>{user.telegram_id}</h4>
                      <Chip mode="outline">
                        {findPig(user.current_pig)?.title || ""}
                      </Chip>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </Accordion>
          </div>
        ),
      };
    });
  };

  return (
    <Page>
      <div className="profile-container">
        <DisplayData
          header={t("wallet")}
          rows={[
            {
              title: t("address"),
              value: (
                <>
                  {walletAddress}
                  <IconButton mode="plain" onClick={handleCopyAddress} size="s">
                    <FontAwesomeIcon
                      icon={isAddressCopied ? faCheck : faCopy}
                    />
                  </IconButton>
                </>
              ),
            },

            { title: t("balance"), value: balance },
            {
              title: "",
              value: (
                <Button
                  before={<FontAwesomeIcon icon={faSignOut} />}
                  mode="gray"
                  onClick={handleDisconnectWallet}
                >
                  {isDisconnectConfirmVisible
                    ? t("areYouSure")
                    : t("disconnectWallet")}
                </Button>
              ),
            },
          ]}
        />
        <DisplayData header={t("referrals")} rows={prepareReferrals()} />
      </div>
    </Page>
  );
}
