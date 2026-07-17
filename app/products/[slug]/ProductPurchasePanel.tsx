"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/CartProvider";
import { scentImageUrl, scentSwatchColor } from "@/lib/format";
import type { ScentRow } from "@/lib/queries/products";

type Props = {
  productId: string;
  primaryScents: ScentRow[];
  priceLabel: string;
  burnTimeHours: number | null;
  sizeGrams: number | null;
  scentId: string | null;
  onScentChange: (id: string) => void;
};

export default function ProductPurchasePanel({
  productId,
  primaryScents,
  priceLabel,
  burnTimeHours,
  sizeGrams,
  scentId,
  onScentChange,
}: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const hasScents = primaryScents.length > 0;
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [scentError, setScentError] = useState(false);

  const selectedScent = useMemo(
    () => primaryScents.find((s) => s.id === scentId) ?? null,
    [primaryScents, scentId],
  );

  const canAdd = !adding && !isPending;

  async function onAdd() {
    if (hasScents && !scentId) {
      setScentError(true);
      return;
    }
    setScentError(false);
    setAdding(true);
    setAdded(false);
    try {
      await addToCart(productId, hasScents ? scentId : null, quantity);
      setAdded(true);
      startTransition(() => router.refresh());
    } finally {
      setAdding(false);
    }
  }

  async function onBuyNow() {
    if (hasScents && !scentId) {
      setScentError(true);
      return;
    }
    setScentError(false);
    setAdding(true);
    try {
      await addToCart(productId, hasScents ? scentId : null, quantity);
      router.push("/checkout");
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

      {hasScents && (
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
        <span className="productPrice">{priceLabel}</span>
        <span className="productPriceNote">
          Ships in reusable glass · Free shipping over E£1,500
        </span>
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
