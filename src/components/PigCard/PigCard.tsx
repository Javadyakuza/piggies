import React, { useState, useRef } from "react";
import "./styles.css";
import Image from "next/image";

// const images = [
//   "/imgs/pigs/placeholder.png",
//   "/imgs/pigs/bronze.png",
//   "/imgs/pigs/gold.png",
//   "/imgs/pigs/diamond.png",
// ];

type PigInfo = {
  hint?: React.ReactNode;
  title: React.ReactNode;
  caption?: React.ReactNode;
  cover: string;
};

const PigCard = ({
  pigInfo,
}: {
  pigInfo: PigInfo;
}) => {
  return (
      <div className="pig-card">
        {pigInfo?.hint && (
          <h4 className="hint">{pigInfo.hint}</h4>
        )}
        {pigInfo?.title && (
          <h2 className="title">{pigInfo.title}</h2>
        )}
        <Image
            width={500}
            height={500}
            src={pigInfo?.cover}
            alt={"Pig image"}
            className="pig-image"
            draggable={false}
        />
        {pigInfo?.caption && (
          <h3 className="caption">{pigInfo.caption}</h3>
        )}
      </div>
  );
};

export default PigCard;
