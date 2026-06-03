"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  alt: string;
};

export default function ProductGallery({ images, alt }: Props) {
  const safe = images.filter(Boolean);
  const [active, setActive] = useState(0);
  if (safe.length === 0) return null;
  const current = safe[Math.min(active, safe.length - 1)];

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
        <div className="productGalleryThumbs" aria-label="Product images">
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
      )}
    </div>
  );
}
