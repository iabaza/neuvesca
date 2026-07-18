"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Slide = { src: string; alt: string };

const slides: Slide[] = [
  {
    src: "/images/hero/hero-1.jpeg",
    alt: "Three Neuvesca body serum candles burning beside dried botanicals.",
  },
  {
    src: "/images/hero/hero-2.jpeg",
    alt: "A stack of Neuvesca body serum candle jars beside driftwood.",
  },
  {
    src: "/images/hero/hero-3.jpeg",
    alt: "A Neuvesca body serum candle lit beside a brass lantern.",
  },
];

const INTERVAL_MS = 5000;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function goTo(idx: number) {
    setActive(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
  }

  return (
    <div
      aria-label="Neuvesca lifestyle"
      className="heroCarousel"
      role="region"
    >
      {slides.map((slide, idx) => (
        <div
          aria-hidden={idx !== active}
          className={`heroCarouselSlide ${
            idx === active ? "is-active" : ""
          }`}
          key={slide.src}
        >
          <Image
            alt={slide.alt}
            className="heroCarouselImage"
            fill
            priority={idx === 0}
            sizes="(min-width: 980px) 55vw, 100vw"
            src={slide.src}
          />
        </div>
      ))}

      <div className="heroCarouselDots" role="tablist">
        {slides.map((_, idx) => (
          <button
            aria-label={`Show slide ${idx + 1}`}
            aria-selected={idx === active}
            className={`heroCarouselDot ${
              idx === active ? "is-active" : ""
            }`}
            key={idx}
            onClick={() => goTo(idx)}
            role="tab"
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
