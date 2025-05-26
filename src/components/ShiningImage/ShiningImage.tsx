/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef } from "react";

const ShiningImage = () => {
  const shiningRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (!shiningRef.current) return;

      const vh = window.visualViewport?.height || window.innerHeight;
      const vw = window.visualViewport?.width || window.innerWidth;

      shiningRef.current.style.position = "fixed";
      // shiningRef.current.style.left = `${(vw - shiningRef.current.offsetWidth) / 2}px`;
      shiningRef.current.style.top = `${(vh - shiningRef.current.offsetHeight) / 2 - 70}px`;
    };

    window.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);

    updatePosition(); // initial call

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, []);

  return (
    <img
      className="shining-image"
      ref={shiningRef}
      src="/imgs/common/shining.png"
      alt="shining"
      onLoad={() => console.log("Shining image loaded")}
      style={{ width: 256, height: 256 }}
    />
  );
};

export default ShiningImage;
