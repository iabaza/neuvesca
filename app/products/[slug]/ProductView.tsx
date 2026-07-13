"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

type Tab = "description" | "ingredients";
import { formatPrice } from "@/lib/format";
import type { ProductDetail } from "@/lib/queries/products";
import ProductGallery from "./ProductGallery";
import ProductPurchasePanel from "./ProductPurchasePanel";

type Props = {
  product: ProductDetail;
};

export default function ProductView({ product }: Props) {
  const hasScents = product.primary_scents.length > 0;
  const [scentId, setScentId] = useState<string | null>(null);

  const selectedScent = useMemo(
    () => product.primary_scents.find((s) => s.id === scentId) ?? null,
    [product.primary_scents, scentId],
  );

  const galleryImages = useMemo(() => {
    const productImages = [
      product.image_url,
      ...(product.gallery_image_urls ?? []),
    ].filter((u): u is string => Boolean(u));
    return productImages.length > 0 ? productImages : ["/images/redsign1.jpeg"];
  }, [product.image_url, product.gallery_image_urls]);

  const [tab, setTab] = useState<Tab>("description");
  const priceLabel = formatPrice(product.price_cents, product.currency);
  const { ingredients } = product;

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

        <div className="productTabs">
          <div className="productTabBar" role="tablist">
            <button
              aria-selected={tab === "description"}
              className={`productTab${tab === "description" ? " productTabActive" : ""}`}
              onClick={() => setTab("description")}
              role="tab"
              type="button"
            >
              Description
            </button>
            <button
              aria-selected={tab === "ingredients"}
              className={`productTab${tab === "ingredients" ? " productTabActive" : ""}`}
              onClick={() => setTab("ingredients")}
              role="tab"
              type="button"
            >
              Ingredients
            </button>
          </div>

          <div className="productTabPanel" role="tabpanel">
            {tab === "description" && (
              <p className="text-[0.98rem] leading-[1.85] text-[var(--ink-soft)]">
                {product.description}
              </p>
            )}
            {tab === "ingredients" && (
              <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
                {ingredients.map((ing) => (
                  <li key={ing.id}>
                    <Link
                      className="text-[0.78rem] uppercase tracking-[0.2em] text-[var(--ink-soft)] hover:text-[var(--clay)] border border-[var(--line)] px-3 py-1.5 inline-block"
                      href={`/ingredients#${ing.slug}`}
                    >
                      {ing.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
