"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useSignal, initData } from "@telegram-apps/sdk-react";
import "./styles.css";
import { TonConnectButton } from "@tonconnect/ui-react";

export default function Header() {
  const initDataState = useSignal(initData.state);
  const userData = initDataState?.user;

  return (
    <div className="main-header">
      <div className="profile-container">
        <div className="avatar-container">
          <div className="avatar">
            <FontAwesomeIcon icon={faUser} size="lg" />
          </div>
          <h4 className="full-name">
            {userData?.firstName} {userData?.lastName}
          </h4>
        </div>
        <TonConnectButton className="ton-connect-page__button-connected" />
      </div>
      <hr />
    </div>
  );
}
