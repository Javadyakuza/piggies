/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef } from "react";
import "./styles.css";
import Image from "next/image";

// const images = [
//   "/imgs/pigs/placeholder.png",
//   "/imgs/pigs/bronze.png",
//   "/imgs/pigs/gold.png",
//   "/imgs/pigs/diamond.png",
// ];

type Slide = {
  title: string;
  pigTitle: string;
  description: string;
  buttonText: string;
  cover: string;
  onClick: () => void;
  isLocked?: boolean;
};

const SuggestionSlider = ({
  slides,
  locked,
}: {
  slides: Slide[];
  locked?: boolean;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const startX = useRef<number | null>(null);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleStart = (x: number) => {
    if (locked) return;
    startX.current = x;
  };

  const handleEnd = (x: number) => {
    if (locked) return;

    if (startX.current === null) return;
    const dx = x - startX.current;

    if (Math.abs(dx) > 50) {
      dx > 0 ? prevSlide() : nextSlide();
    }

    startX.current = null;
  };

  return (
    <div
      className="suggestion-slider-container"
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseUp={(e) => handleEnd(e.clientX)}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
    >
      {!locked && (
        <div className="slider-dots">
          {slides.map((_, index) => (
            <span
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`dot ${currentIndex === index ? "active" : ""}`}
            ></span>
          ))}
        </div>
      )}

      <div className="slider-wrapper">
        <div
          className="slider-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div className="suggestion-slide" key={index}>
              <div className="text">
                <h2>{slide.title}</h2>
                <h2 className="bold">{slide.pigTitle}</h2>
                <h3>{slide.description}</h3>
              </div>
              <div className="action">
                <img
                  className="action-img"
                  src={slide.cover}
                  alt="action-img"
                />
                <button onClick={slide.onClick} className="action-btn">
                  <div>{slide.buttonText}</div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestionSlider;
