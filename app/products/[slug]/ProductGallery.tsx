"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";

type Props = {
  images: string[];
  alt: string;
};

export default function ProductGallery({ images, alt }: Props) {
  const safe = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Reset active index when images change (scent switch)
  useEffect(() => {
    setActive(0);
  }, [images]);

  // Keep active thumb scrolled into view
  useEffect(() => {
    const container = thumbsRef.current;
    if (!container) return;
    const thumb = container.children[active] as HTMLElement | undefined;
    if (thumb) {
      thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [active]);

  // Track scroll position to show/hide arrows
  function updateArrows() {
    const el = thumbsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    const el = thumbsRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [images]);

  if (safe.length === 0) return null;
  const current = safe[Math.min(active, safe.length - 1)];

  function scrollThumbs(dir: "left" | "right") {
    const el = thumbsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  }

  return (
    <div className="productGalleryWrap">
      <div className="productGalleryFrame">
        <Image
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          src={current}
        />
      </div>

      {safe.length > 1 && (
        <div className="productGallerySlider">
          {canScrollLeft && (
            <button
              aria-label="Scroll left"
              className="productGalleryArrow productGalleryArrow--left"
              onClick={() => scrollThumbs("left")}
              type="button"
            >
              ‹
            </button>
          )}

          <div
            aria-label="Product images"
            className="productGalleryThumbs"
            ref={thumbsRef}
          >
            {safe.map((url, idx) => {
              const isActive = idx === active;
              return (
                <button
                  aria-label={`Show image ${idx + 1}`}
                  aria-pressed={isActive}
                  className="productGalleryThumb"
                  key={`${url}-${idx}`}
                  onClick={() => setActive(idx)}
                  type="button"
                >
                  <Image alt="" fill sizes="80px" src={url} />
                </button>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              aria-label="Scroll right"
              className="productGalleryArrow productGalleryArrow--right"
              onClick={() => scrollThumbs("right")}
              type="button"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}
