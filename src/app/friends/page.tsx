/* eslint-disable @next/next/no-img-element */
"use client";
import { Page } from "@/components/Page";
import { useTranslations } from "next-intl";
import "./styles.css";
import { useTonWallet } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { pigsMapNew } from "@/utils/pigs_map";
import { copyToClipboard } from "@/utils/copy-to-clipboard";
import { generateRefLink } from "@/utils/reflink";
import { useSignal, initData } from "@telegram-apps/sdk-react";

type PigData = {
  pig_level: number;
  buyable_pigs: number;
};

type DataPerLevel = Record<
  string,
  {
    totalSlots: number;
    slots: number;
    pig: number;
    bronze: number;
    silver: number;
    gold: number;
    diamond: number;
  }
>;

type ReferralLevelResponse = {
  [key: string]: {
    count: number;
    total: number;
    users: {
      telegram_id: string;
      wallet_address: string;
      current_pig: number;
      fullname: string;
      inviter_id: number;
      total_invited: number;
      user_type: number;
      total_under: number;
    }[];
  };
};

export type BatchReferrals = {
  [level: string]: {
    id: number;
    telegram_id: string;
    inviter_id: number;
    parent_id: number;
    created_at: string;
    referral_id: string;
    wallet_address: string;
    current_pig: number;
    fullname: string;
    piggy_bank_balance: number;
    user_type: number;
    pig_address: string;
  }[];
};

export default function FriendsPage() {
  const t = useTranslations("i18n");
  const [referralId, setReferralId] = useState("");
  const [currentPigCode, setCurrentPigCode] = useState<number | undefined>();
  const [openedAccordion, setOpenedAccordion] = useState<
    "ref" | number | undefined
  >();
  const [pigsData, setPigsData] = useState<PigData>();
  const [pigsDataPerLevel, setPigsDataPerLevel] = useState<DataPerLevel>({});
  const [batchReferrals, setBatchReferrals] = useState<BatchReferrals>({});

  const wallet = useTonWallet();
  const walletAddress =
    "0:656086d563785e2017419371ee481604a931dd019dc8e0111490664af348dc4f";
  // wallet?.account?.address;

  const initDataState = useSignal(initData.state);
  const userTelegramId = initDataState?.user?.id;

  const truncate = (str: string, maxLength: number) => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + "...";
  };

  const fetchPigsData = async () => {
    if (!walletAddress) return;

    const response = await axios
      .get(`/api/pigs/${walletAddress}`)
      .catch((err) => {
        return null;
      });
    const pigsDataToSet = response?.data || undefined;
    setPigsData(pigsDataToSet);
  };

  useEffect(() => {
    fetchPigsData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  const handleFetchReferralPerLevel = async (pigCode: number) => {
    const pig = pigsMap.find((item) => item.code === pigCode);
    if (!walletAddress || !pig) return;
    const pigsDataToSet: DataPerLevel = {};

    const response: AxiosResponse<ReferralLevelResponse> = await axios.get(
      `/api/user-tree/referrals?wallet_address=${walletAddress}&telegram_id=${userTelegramId}&referrals=${pig.level}`
    );

    const referrals = response.data;

    Object.keys(referrals).forEach((key) => {
      const referral = referrals[key];
      const getPigsNumber = (pigLevel: number) =>
        referral.users.filter((user) => user.current_pig === pigLevel).length;

      pigsDataToSet[key] = {
        totalSlots: referral.total,
        slots: referral.count,
        pig: pig.code,
        bronze: getPigsNumber(1),
        silver: getPigsNumber(2),
        gold: getPigsNumber(3),
        diamond: getPigsNumber(4),
      };
    });

    setPigsDataPerLevel(pigsDataToSet);
  };

  useEffect(() => {
    if (!pigsData) return;
    setCurrentPigCode(pigsData.pig_level);
    handleFetchReferralPerLevel(pigsData.pig_level);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pigsData]);

  useEffect(() => {
    if (!walletAddress && referralId) return;

    const fetchUserData = async () => {
      try {
        const response: AxiosResponse<{
          referral_id: string;
        }> = await axios.get(`/api/user-tree/${walletAddress}`);
        const referralId = response.data.referral_id;
        setReferralId(referralId);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [walletAddress, referralId]);

  useEffect(() => {
    if (!walletAddress) return;

    const fetchBatchReferrals = async () => {
      try {
        const response: AxiosResponse<BatchReferrals> = await axios.get(
          `/api/user-tree/referrals?wallet_address=${walletAddress}&referrals=batch&telegram_id=${userTelegramId}`
        );
        const referrals = response.data;
        setBatchReferrals(referrals);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchBatchReferrals();
  }, [walletAddress]);

  const refLink = generateRefLink(referralId);

  const handleCopyAddress = () => {
    copyToClipboard(refLink);
  };
  const toggleRefAccordion = () => {
    setOpenedAccordion(openedAccordion === "ref" ? undefined : "ref");
  };

  const pigsMap = pigsMapNew(t, 0);

  const currentPig =
    currentPigCode || currentPigCode === 0
      ? pigsMap.find((item) => item.code === currentPigCode)
      : undefined;

  const nextPig =
    currentPigCode || currentPigCode === 0
      ? pigsMap.find((item) => item.code === currentPigCode + 1)
      : undefined;

  const levels = currentPig?.level || 0;

  const lockedLevels = [(currentPig?.level || 0) + 1, nextPig?.level || 0];

  const toggleLevelAccordion = (level: number) => {
    setOpenedAccordion(openedAccordion === level ? undefined : level);
  };

  const EmptyState = (
    <div className="empty-container">
      <span className="empty">{t("friendsPage.invitationSomeone")}</span>
    </div>
  );

  const findPig = (code: number) => {
    return pigsMap.find((item) => item.code === code);
  };

  const formattedReferrals = Object.entries(batchReferrals).flatMap((entry) => {
    const [key, value] = entry;
    return value.flatMap((v) => ({ ...v, level: key }));
  });

  const RefAccordionContent = () => {
    return (
      <div className="ref-accordion-content">
        {formattedReferrals.length ? (
          <div className="invites-container">
            {formattedReferrals.map((invite, i) => {
              const targetPig = findPig(invite.current_pig);
              const pigClassName = targetPig?.title
                .replace(" Pig", "")
                .toLowerCase();
              return (
                <div className="invite-item" key={i}>
                  <div className="details">
                    <div className="head">
                      <h2>
                        {invite.fullname}{" "}
                        <span className="level">
                          (
                          {t("friendsPage.levelReferrals", {
                            level: invite.level,
                          })}
                          )
                        </span>
                      </h2>
                    </div>
                    <div className="footer">
                      <h5 className={pigClassName}>{targetPig?.title}</h5>
                    </div>
                  </div>
                  <div className="pig-pic">
                    <img
                      src={targetPig?.cover || "/imgs/pigs/placeholder.png"}
                      alt="pig-cover"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          EmptyState
        )}
      </div>
    );
  };

  const LevelAccordionContent = (level: number) => {
    const targetLevel = pigsDataPerLevel[`level_${level}`];
    return (
      <div className="level-accordion-content">
        <h3 className="slots">
          {t("friendsPage.slots", {
            current: targetLevel.slots,
            total: targetLevel.totalSlots,
          })}
        </h3>
        <h3 className="bronze">
          {t("friendsPage.bronzePigs", { number: targetLevel.bronze })}
          <span className="your-refs">
            {/* {" "}
            ({t("friendsPage.yourRefs", { number: 1 })}) */}
          </span>
        </h3>
        <h3 className="silver">
          {t("friendsPage.silverPigs", { number: targetLevel.silver })}
          <span className="your-refs">
            {/* {" "}
            ({t("friendsPage.yourRefs", { number: 1 })}) */}
          </span>
        </h3>
        <h3 className="gold">
          {t("friendsPage.goldPigs", { number: targetLevel.gold })}
          <span className="your-refs">
            {/* {" "}
            ({t("friendsPage.yourRefs", { number: 1 })}) */}
          </span>
        </h3>
        <h3 className="diamond">
          {t("friendsPage.diamondPigs", { number: targetLevel.diamond })}
          <span className="your-refs">
            {/* {" "}
            ({t("friendsPage.yourRefs", { number: 1 })}) */}
          </span>
        </h3>
      </div>
    );
  };

  return (
    <Page>
      <div className="friends-container">
        <div className="invite-container">
          <h3 className="title">{t("friendsPage.title")}</h3>
          <div className="invite-link">
            <h3 className="link">{truncate(refLink, 25)}</h3>
            <button className="copy-btn">
              <img
                src="/imgs/icons/copy.png"
                alt="copy-icon"
                onClick={handleCopyAddress}
              />
            </button>
          </div>
          <p className="hint">{t("friendsPage.hint")}</p>
        </div>
        <div className="accordion-container">
          <div onClick={toggleRefAccordion} className="accordion your-refs">
            <h2 className="title">{t("friendsPage.yourReferrals")}</h2>
            <div
              className={`arrow ${openedAccordion === "ref" ? "--open" : ""}`}
            >
              <img src="/imgs/icons/arrow-right.png" alt="arrow-icon" />
            </div>
          </div>
          {openedAccordion === "ref" && <RefAccordionContent />}
          {Array.from({ length: levels }).map((_, i) => {
            const level = i + 1;
            return (
              <>
                <div
                  onClick={() => toggleLevelAccordion(level)}
                  className="accordion level"
                  key={i}
                >
                  <h2 className="title">
                    {t("friendsPage.levelReferrals", { level })}
                  </h2>
                  <div
                    className={`arrow ${openedAccordion === level ? "--open" : ""}`}
                  >
                    <img src="/imgs/icons/arrow-right.png" alt="arrow-icon" />
                  </div>
                </div>
                {openedAccordion === level && LevelAccordionContent(level)}
              </>
            );
          })}
          <div className="accordion level locked">
            <div className="locked-title">
              <h2 className="title ">
                {t("friendsPage.levelReferrals", {
                  level: lockedLevels.join(" - "),
                })}
              </h2>
              <img
                className="locked-img"
                src="/imgs/icons/locked.png"
                alt="locked"
              />
            </div>
            <div className="arrow">
              <img src="/imgs/icons/arrow-right-bright.png" alt="arrow-icon" />
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
