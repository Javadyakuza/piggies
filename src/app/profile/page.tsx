/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import "./styles.css";
import {
  faCheck,
  faCopy,
  faSignOut,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Accordion, Button, IconButton } from "@telegram-apps/telegram-ui";
import { DisplayData } from "@/components/DisplayData/DisplayData";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { AccordionContent } from "@telegram-apps/telegram-ui/dist/components/Blocks/Accordion/components/AccordionContent/AccordionContent";
import { AccordionSummary } from "@telegram-apps/telegram-ui/dist/components/Blocks/Accordion/components/AccordionSummary/AccordionSummary";
import { pigsMap } from "@/utils/pigs_map";
import { useSignal, initData } from "@telegram-apps/sdk-react";
import { copyToClipboard } from "@/utils/copy-to-clipboard";

type PigData = {
  pig_level: number;
  buyable_pigs: number;
};

export default function ProfilePage() {
  const t = useTranslations("i18n");
  const wallet = useTonWallet();
  const pigs = pigsMap(t);

  const truncate = (str: string, maxLength: number) => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + "...";
  };
  const findPig = (targetCode: number) =>
    pigs.find((pig) => pig.code === targetCode);

  const [tonConnectUI] = useTonConnectUI();

  const [balance, setBalance] = useState(0);
  const [isBalanceSet, setIsBalanceSet] = useState(false);
  const [isAddressCopied, setIsAddressCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [userId, setUserId] = useState<number>();
  const [currentPigCode, setCurrentPigCode] = useState<number | undefined>();
  const [pigsData, setPigsData] = useState<PigData>();

  const [referrals, setReferrals] = useState<
    Record<
      string,
      {
        count: number;
        total: number;
        users: {
          telegram_id: string;
          inviter_id: number;
          fullname: string;
          current_pig: number;
          total_invited: number;
          total_under: number;
        }[];
      }
    >
  >({});
  const [isDisconnectConfirmVisible, setIsDisconnectConfirmVisible] =
    useState(false);
  const [expandedLevel, setExpandedLevel] = useState("");

  const initDataState = useSignal(initData.state);
  const userTelegramId = initDataState?.user?.id;
  // const userTelegramId = 168185687;

  const handleDisconnectWallet = () => {
    if (isDisconnectConfirmVisible) tonConnectUI.disconnect();
    else {
      setIsDisconnectConfirmVisible(true);
    }
  };

  const fetchPigsData = async () => {
    if (!wallet) return;

    const response = await axios
      .get(`/api/pigs/${userTelegramId}`)
      .catch((err) => {
        console.error("Error fetching pigs data:", err);
        return null;
      });

    const pigsDataToSet = response?.data || undefined;
    setPigsData(pigsDataToSet);
  };

  useEffect(() => {
    fetchPigsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  useEffect(() => {
    if (!pigsData) return;
    setCurrentPigCode(pigsData.pig_level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pigsData]);

  useEffect(() => {
    if (isDisconnectConfirmVisible) {
      setTimeout(() => {
        setIsDisconnectConfirmVisible(false);
      }, 1300);
    }
  }, [isDisconnectConfirmVisible]);

  useEffect(() => {
    if (userId || !userTelegramId) return;

    const fetchUserData = async () => {
      try {
        const response: AxiosResponse<{
          id: number;
        }> = await axios.get(`/api/user-tree/${userTelegramId}`);
        const userIdToSet = response.data.id;
        setUserId(userIdToSet);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [userId, userTelegramId]);

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

  const currentPig = pigs.find((pig) => pig.code === currentPigCode);

  useEffect(() => {
    if (wallet && userTelegramId && currentPigCode) {
      setWalletAddress(wallet?.account.address);

      const fetchReferrals = async () => {
        const referrals = currentPig?.levels;
        const response = await fetch(
          `/api/user-tree/${userTelegramId}/${referrals}`
        );
        const data = await response.json();
        setReferrals(data);
      };
      fetchReferrals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, userTelegramId, currentPigCode]);

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
    copyToClipboard(walletAddress);
  };

  const handleReferralLevelClick = (level: string) => {
    if (expandedLevel === level) setExpandedLevel("");
    else setExpandedLevel(level);
  };

  const prepareReferrals = () => {
    const levels = Object.keys(referrals).filter(
      (level) => !!level.startsWith("level_")
    );

    return levels.map((level) => {
      const referralData = referrals[level] || { users: [] };

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
                  {referralData.users.map((user) => {
                    const pig = findPig(user.current_pig);
                    return (
                      <div
                        className={`user-card ${
                          user.inviter_id === userId ? "--invited-by-me" : ""
                        }`}
                        key={user.telegram_id}
                      >
                        <div className="info">
                          <h4 className="user-name">
                            {truncate(user.fullname, 14)}
                          </h4>
                          <div className="inline-box">
                            <h4 className="invited">
                              {t("invitedUsers", {
                                usersInvited: user.total_invited,
                              })}
                            </h4>{" "}
                            <h4 className="invited">
                              {t("usersTree", {
                                totalUnder: user.total_under,
                              })}
                            </h4>
                          </div>
                        </div>
                        <div className="avatar">
                          {pig && pig.iconUrl ? (
                            <img
                              className="pig-icon"
                              src={pig.iconUrl}
                              alt="pig-icon"
                            />
                          ) : (
                            "❌"
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {referralData.users.length === 0 && (
                    <div className="user-card">
                      <h4>{t("noReferrals")}</h4>
                    </div>
                  )}
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
