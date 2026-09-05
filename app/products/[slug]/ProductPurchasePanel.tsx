"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/CartProvider";
import { trackAddToCart } from "@/lib/analytics/meta";
import { scentImageUrl, scentSwatchColor } from "@/lib/format";
import type { ScentRow } from "@/lib/queries/products";

type Props = {
  productId: string;
  productName: string;
  /** Cents the customer actually pays, after any discount. */
  unitPriceCents: number;
  currency: string;
  primaryScents: ScentRow[];
  /** Price the customer pays — already discounted. */
  priceLabel: string;
  /** Original price, only set when the product is on sale. */
  listPriceLabel?: string | null;
  savingsLabel?: string | null;
  discountPercent?: number;
  /** False for products not packaged in glass (e.g. the match box). */
  showsGlassNote?: boolean;
  burnTimeHours: number | null;
  sizeGrams: number | null;
  scentId: string | null;
  onScentChange: (id: string) => void;
  /** How many scent picks this product needs — 1 for a normal candle, 2/3+ for a bundle. */
  bundleSize?: number;
  /**
   * Optional per-slot size label (e.g. "150ml") shown next to "Scent N of M"
   * so the buyer knows which scent pick applies to which item in the bundle.
   * Index-aligned with the bundle slots; a missing entry just omits the label.
   */
  bundleSlotLabels?: (string | null)[];
};

export default function ProductPurchasePanel({
  productId,
  productName,
  unitPriceCents,
  currency,
  primaryScents,
  priceLabel,
  listPriceLabel,
  savingsLabel,
  discountPercent = 0,
  showsGlassNote = true,
  burnTimeHours,
  sizeGrams,
  scentId,
  onScentChange,
  bundleSize = 1,
  bundleSlotLabels,
}: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const hasScents = primaryScents.length > 0;
  const isBundle = bundleSize > 1 && hasScents;
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [scentError, setScentError] = useState(false);

  // One slot per candle in the bundle. Kept separate from the single-scent
  // `scentId` state above so the ordinary (bundleSize === 1) path is entirely
  // unaffected by this — it never reads or writes bundleScentIds.
  const [bundleScentIds, setBundleScentIds] = useState<Array<string | null>>(
    () => Array.from({ length: bundleSize }, () => null),
  );

  // Guards against a stale selection surviving a client-side navigation to a
  // different product page — reset explicitly rather than relying on this
  // component unmounting between products.
  useEffect(() => {
    setBundleScentIds(Array.from({ length: bundleSize }, () => null));
  }, [productId, bundleSize]);

  const selectedScent = useMemo(
    () => primaryScents.find((s) => s.id === scentId) ?? null,
    [primaryScents, scentId],
  );

  const bundleComplete = bundleScentIds.every((id) => id !== null);
  const canAdd = !adding && !isPending;

  function setBundleSlot(index: number, id: string) {
    setBundleScentIds((current) => {
      const next = [...current];
      next[index] = id;
      return next;
    });
    setScentError(false);
  }

  async function commit(): Promise<boolean> {
    if (isBundle) {
      if (!bundleComplete) {
        setScentError(true);
        return false;
      }
      setScentError(false);
      await addToCart(productId, null, quantity, bundleScentIds as string[]);
    } else {
      if (hasScents && !scentId) {
        setScentError(true);
        return false;
      }
      setScentError(false);
      await addToCart(productId, hasScents ? scentId : null, quantity);
    }
    trackAddToCart(
      { id: productId, name: productName, priceCents: unitPriceCents, currency },
      quantity,
    );
    return true;
  }

  async function onAdd() {
    setAdding(true);
    setAdded(false);
    try {
      const ok = await commit();
      if (ok) {
        setAdded(true);
        startTransition(() => router.refresh());
      }
    } finally {
      setAdding(false);
    }
  }

  async function onBuyNow() {
    setAdding(true);
    try {
      const ok = await commit();
      if (ok) router.push("/checkout");
    } finally {
      setAdding(false);
    }
  }

  const ozLabel = sizeGrams ? (sizeGrams / 28.3495).toFixed(1) : null;
  const hasSpecs = burnTimeHours != null || sizeGrams != null;

  return (
    <div className="grid gap-7">
      {hasSpecs && (
        <dl className="productSpecs" aria-label="Product specifications">
          {burnTimeHours != null && (
            <div>
              <dt>Burning Hours</dt>
              <dd>{burnTimeHours}+ hours</dd>
            </div>
          )}
          {sizeGrams != null && (
            <div>
              <dt>Weight</dt>
              <dd>
                {ozLabel}oz / {sizeGrams}g
              </dd>
            </div>
          )}
        </dl>
      )}

      {isBundle ? (
        <div className="grid gap-5">
          {bundleScentIds.map((slotScentId, index) => {
            const slotSelected = primaryScents.find((s) => s.id === slotScentId) ?? null;
            return (
              <fieldset className="scentPicker" key={index}>
                <legend className="scentPickerHeader">
                  <span className="eyebrow">
                    Scent {index + 1} of {bundleSize}
                    {bundleSlotLabels?.[index] && ` — ${bundleSlotLabels[index]}`}
                  </span>
                  {slotSelected && (
                    <span className="scentSelected">{slotSelected.name}</span>
                  )}
                </legend>

                <div className="scentRow">
                  {primaryScents.map((s) => {
                    const selected = slotScentId === s.id;
                    const img = s.image_url ?? scentImageUrl(s.slug);
                    return (
                      <div className="scentTile" key={s.id}>
                        <button
                          aria-label={`Choose ${s.name} for scent ${index + 1}`}
                          aria-pressed={selected}
                          className="scentTileImage"
                          onClick={() => setBundleSlot(index, s.id)}
                          type="button"
                        >
                          {img ? (
                            <Image alt="" fill sizes="96px" src={img} />
                          ) : (
                            <span className="scentTileSwatch">
                              <span style={{ background: scentSwatchColor(s.slug) }} />
                            </span>
                          )}
                        </button>
                        <span className="scentTileName">{s.name}</span>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {scentError && (
            <p className="scentError" role="alert">
              Please choose a scent for each candle in the bundle.
            </p>
          )}
        </div>
      ) : (
        hasScents && (
          <fieldset className="scentPicker">
            <legend className="scentPickerHeader">
              <span className="eyebrow">
                Choose your scent
                <span className="scentPickerCount">
                  {primaryScents.length}{" "}
                  {primaryScents.length === 1 ? "option" : "options"}
                </span>
              </span>
              {selectedScent && (
                <span className="scentSelected">{selectedScent.name}</span>
              )}
            </legend>

            <div className="scentRow">
              {primaryScents.map((s) => {
                const selected = scentId === s.id;
                const img = s.image_url ?? scentImageUrl(s.slug);
                return (
                  <div className="scentTile" key={s.id}>
                    <button
                      aria-label={`Choose ${s.name}`}
                      aria-pressed={selected}
                      className="scentTileImage"
                      onClick={() => { onScentChange(s.id); setScentError(false); }}
                      type="button"
                    >
                      {img ? (
                        <Image alt="" fill sizes="96px" src={img} />
                      ) : (
                        <span className="scentTileSwatch">
                          <span
                            style={{ background: scentSwatchColor(s.slug) }}
                          />
                        </span>
                      )}
                    </button>
                    <span className="scentTileName">{s.name}</span>
                  </div>
                );
              })}
            </div>

            {selectedScent?.description && (
              <p className="scentDescription">{selectedScent.description}</p>
            )}
            {scentError && (
              <p className="scentError" role="alert">
                Please choose a scent before adding to bag.
              </p>
            )}
          </fieldset>
        )
      )}

      <div className="flex items-center gap-4">
        <span className="eyebrow !mb-0">Quantity</span>
        <div className="qtyStepper">
          <button
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            type="button"
          >
            −
          </button>
          <span>{quantity}</span>
          <button
            aria-label="Increase quantity"
            disabled={quantity >= 10}
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            type="button"
          >
            +
          </button>
        </div>
      </div>

      <div className="productPriceRow">
        {listPriceLabel ? (
          <>
            <span className="productPriceSale">
              <span className="priceNow">{priceLabel}</span>
              <span className="priceWas">{listPriceLabel}</span>
            </span>
            {savingsLabel && (
              <span className="productSaveNote">
                Save {savingsLabel} · {discountPercent}% off
              </span>
            )}
          </>
        ) : (
          <span className="productPrice">{priceLabel}</span>
        )}
        {showsGlassNote && (
          <span className="productPriceNote">
            Ships in reusable glass · Free shipping over E£1,500
          </span>
        )}
      </div>

      <button
        className="button primary full large"
        disabled={!canAdd}
        onClick={onAdd}
        type="button"
      >
        {adding
          ? "Adding to bag…"
          : added
            ? "Added to bag"
            : isBundle
              ? "Add bundle to bag"
              : hasScents && selectedScent
                ? `Add ${selectedScent.name} to bag`
                : "Add to bag"}
      </button>

      <button
        className="button secondary full large"
        disabled={!canAdd}
        onClick={onBuyNow}
        type="button"
      >
        {adding ? "Please wait…" : "Buy now"}
      </button>
    </div>
  );
}
