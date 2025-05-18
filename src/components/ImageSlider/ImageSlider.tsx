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
  hint?: React.ReactNode;
  title: React.ReactNode;
  caption?: React.ReactNode;
  cover: string;
};

const ImageSlider = ({ slides }: { slides: Slide[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const startX = useRef<number | null>(null);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleStart = (x: number) => {
    startX.current = x;
  };

  const handleEnd = (x: number) => {
    if (startX.current === null) return;
    const dx = x - startX.current;

    if (Math.abs(dx) > 50) {
      dx > 0 ? prevSlide() : nextSlide();
    }

    startX.current = null;
  };

  return (
    <div
      className="slider-container"
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseUp={(e) => handleEnd(e.clientX)}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
    >
      <div className="slider-wrapper">
        <div
          className="slider-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div className="slider-slide" key={index}>
              <h4 className="hint"> {slide.hint || <></>}</h4>
              <h2 className="title">{slide.title}</h2>
              <Image
                width={500}
                height={500}
                src={slide.cover}
                alt={`Slide ${index + 1}`}
                className="slider-image"
                draggable={false}
              />
              <h3 className="caption">{slide.caption || <></>}</h3>
            </div>
          ))}
        </div>
      </div>

      <div className="slider-dots">
        {slides.map((_, index) => (
          <span
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`dot ${currentIndex === index ? "active" : ""}`}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
