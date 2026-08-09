"use client";

import Image from "next/image";
import { useState, useMemo, useEffect, useRef } from "react";
import { trackViewContent } from "@/lib/analytics/meta";
import { INGREDIENT_ITEMS } from "@/lib/ingredients-data";
import {
  clampDiscountPercent,
  effectivePriceCents,
  formatPrice,
  hasDiscount,
} from "@/lib/format";
import type { ProductDetail } from "@/lib/queries/products";
import ProductGallery from "./ProductGallery";
import ProductPurchasePanel from "./ProductPurchasePanel";

type Tab = "description" | "ingredients";

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

  const showDescription = product.show_description_tab ?? true;
  const showIngredients = product.show_ingredients_tab ?? true;
  const showTabs = showDescription || showIngredients;

  const defaultTab: Tab = showDescription ? "description" : "ingredients";
  const [tab, setTab] = useState<Tab>(defaultTab);

  const onSale = hasDiscount(product.discount_percent);
  const salePriceCents = effectivePriceCents(
    product.price_cents,
    product.discount_percent,
  );
  const priceLabel = formatPrice(salePriceCents, product.currency);

  // Meta "ViewContent" — the signal Meta uses to build product-interest
  // audiences. Value is the discounted price, i.e. what the visitor would
  // actually pay.
  //
  // Guarded by product id rather than relying on the effect running once:
  // React Strict Mode double-invokes effects, and a duplicated ViewContent
  // would overstate product interest in the ad account.
  const viewedProductId = useRef<string | null>(null);
  useEffect(() => {
    if (viewedProductId.current === product.id) return;
    viewedProductId.current = product.id;
    trackViewContent({
      id: product.id,
      name: product.name,
      priceCents: salePriceCents,
      currency: product.currency,
      category: product.category,
    });
  }, [product.id, product.name, product.currency, product.category, salePriceCents]);
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
          discountPercent={onSale ? clampDiscountPercent(product.discount_percent) : 0}
          listPriceLabel={
            onSale ? formatPrice(product.price_cents, product.currency) : null
          }
          onScentChange={setScentId}
          priceLabel={priceLabel}
          currency={product.currency}
          primaryScents={product.primary_scents}
          productId={product.id}
          productName={product.name}
          savingsLabel={
            onSale
              ? formatPrice(product.price_cents - salePriceCents, product.currency)
              : null
          }
          scentId={scentId}
          sizeGrams={product.size_grams}
          unitPriceCents={salePriceCents}
        />

        {showTabs && (
          <div className="productTabs">
            <div className="productTabBar" role="tablist">
              {showDescription && (
                <button
                  aria-selected={tab === "description"}
                  className={`productTab${tab === "description" ? " productTabActive" : ""}`}
                  onClick={() => setTab("description")}
                  role="tab"
                  type="button"
                >
                  Description
                </button>
              )}
              {showIngredients && (
                <button
                  aria-selected={tab === "ingredients"}
                  className={`productTab${tab === "ingredients" ? " productTabActive" : ""}`}
                  onClick={() => setTab("ingredients")}
                  role="tab"
                  type="button"
                >
                  Ingredients
                </button>
              )}
            </div>

            <div className="productTabPanel" role="tabpanel">
              {tab === "description" && showDescription && (
                <p className="text-[0.98rem] leading-[1.85] text-[var(--ink-soft)]">
                  Light the wick and let the wax pool transform into a warm,
                  nourishing serum. After ten minutes, blow out the flame, let
                  the pool settle for a moment, then pour into the palm and
                  massage into skin while still tepid. The candle becomes a
                  balm; the room keeps its quiet glow.
                </p>
              )}
              {tab === "ingredients" && showIngredients && (
                <div className="productIngredientGrid">
                  {INGREDIENT_ITEMS.map((item) => (
                    <div className="productIngredientCard" key={item.slug}>
                      <div className="productIngredientImg">
                        <Image
                          alt={item.name}
                          fill
                          sizes="80px"
                          src={item.image}
                        />
                      </div>
                      <div className="productIngredientInfo">
                        <span className="productIngredientName">{item.name}</span>
                        <span className="productIngredientTagline">{item.tagline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
