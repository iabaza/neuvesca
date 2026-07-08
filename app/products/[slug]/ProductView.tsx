"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { scentImageUrl, formatPrice } from "@/lib/format";
import type { ProductDetail } from "@/lib/queries/products";
import ProductGallery from "./ProductGallery";
import ProductPurchasePanel from "./ProductPurchasePanel";

type Props = {
  product: ProductDetail;
};

export default function ProductView({ product }: Props) {
  const hasScents = product.primary_scents.length > 0;
  const [scentId, setScentId] = useState<string | null>(
    product.primary_scents[0]?.id ?? null,
  );

  const selectedScent = useMemo(
    () => product.primary_scents.find((s) => s.id === scentId) ?? null,
    [product.primary_scents, scentId],
  );

  const galleryImages = useMemo(() => {
    const productImages = [
      product.image_url,
      ...(product.gallery_image_urls ?? []),
    ].filter((u): u is string => Boolean(u));

    if (!hasScents || !selectedScent) {
      return productImages.length > 0 ? productImages : ["/images/redsign1.jpeg"];
    }

    const scentImg = selectedScent.image_url ?? scentImageUrl(selectedScent.slug);
    const rest = productImages.filter((u) => u !== scentImg);
    const base = scentImg ? [scentImg, ...rest] : productImages;

    return base.length > 0 ? base : ["/images/redsign1.jpeg"];
  }, [selectedScent, product.image_url, product.gallery_image_urls, hasScents]);

  const priceLabel = formatPrice(product.price_cents, product.currency);
  const { composition, ingredients } = product;

  return (
    <div className="productDetailMain">
      <aside className="productGallery">
        <ProductGallery alt={product.name} images={galleryImages} />
      </aside>

      <section className="productPanel">
        <header className="productHeader">
          <p className="eyebrow">{product.family}</p>
          <h1>{product.name}</h1>
          <p className="lede">{product.description}</p>
        </header>

        <ProductPurchasePanel
          burnTimeHours={product.burn_time_hours}
          onScentChange={setScentId}
          priceLabel={priceLabel}
          primaryScents={product.primary_scents}
          productId={product.id}
          scentId={scentId}
          sizeGrams={product.size_grams}
        />

        {(composition.top.length > 0 ||
          composition.heart.length > 0 ||
          composition.base.length > 0) && (
          <section className="grid gap-3 border-t border-[var(--line-soft)] pt-6">
            <p className="eyebrow !mb-0">Composition</p>
            <dl className="grid gap-3">
              {(["top", "heart", "base"] as const).map((role) => {
                const list = composition[role];
                if (list.length === 0) return null;
                return (
                  <div className="grid grid-cols-[6rem_1fr] gap-3" key={role}>
                    <dt className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--muted)]">
                      {role}
                    </dt>
                    <dd className="[font-family:var(--serif)] text-[1.05rem] italic">
                      {list.map((s) => s.name).join(", ")}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}

        <section className="grid gap-3 border-t border-[var(--line-soft)] pt-6">
          <p className="eyebrow !mb-0">Ingredients</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-[0.95rem] text-[var(--ink-soft)]">
            {ingredients.map((ing) => (
              <li
                className="border border-[var(--line)] px-3 py-1.5"
                key={ing.id}
              >
                <Link
                  className="text-[0.78rem] uppercase tracking-[0.2em] hover:text-[var(--clay)]"
                  href={`/ingredients#${ing.slug}`}
                >
                  {ing.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </div>
  );
}
