"use client";

import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";

type Props = {
  images: string[];
  alt: string;
};

export default function ProductGallery({ images, alt }: Props) {
  const safe = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [animKey, setAnimKey] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setActive(0);
    setAnimKey((k) => k + 1);
  }, [images]);

  const go = useCallback(
    (idx: number, dir: "left" | "right") => {
      setDirection(dir);
      setActive(idx);
      setAnimKey((k) => k + 1);
    },
    [],
  );

  const prev = useCallback(
    () => go((active - 1 + safe.length) % safe.length, "left"),
    [active, safe.length, go],
  );

  const next = useCallback(
    () => go((active + 1) % safe.length, "right"),
    [active, safe.length, go],
  );

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  }

  if (safe.length === 0) return null;

  const enterClass =
    direction === "right" ? "galleryImageEnterRight" : "galleryImageEnterLeft";

  return (
    <div className="productGalleryWrap">
      <div
        className="productGalleryFrame"
        onTouchEnd={onTouchEnd}
        onTouchStart={onTouchStart}
      >
        <div className={`galleryImageSlot ${enterClass}`} key={animKey}>
          <Image
            alt={alt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            src={safe[active]}
          />
        </div>

        {safe.length > 1 && (
          <>
            <button
              aria-label="Previous image"
              className="galleryArrow galleryArrow--prev"
              onClick={prev}
              type="button"
            >
              ‹
            </button>
            <button
              aria-label="Next image"
              className="galleryArrow galleryArrow--next"
              onClick={next}
              type="button"
            >
              ›
            </button>
          </>
        )}
      </div>

      {safe.length > 1 && (
        <div aria-label="Image navigation" className="galleryDots">
          {safe.map((_, idx) => (
            <button
              aria-label={`Go to image ${idx + 1}`}
              aria-pressed={idx === active}
              className={`galleryDot${idx === active ? " galleryDotActive" : ""}`}
              key={idx}
              onClick={() => go(idx, idx > active ? "right" : "left")}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}
