"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart/CartProvider";
import { formatPrice } from "@/lib/format";
import {
  readStoredPromo,
  writeStoredPromo,
  type StoredPromo,
} from "@/lib/cart/promo";
import { createClient } from "@/lib/supabase/client";

export default function CartPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const {
    items,
    subtotalCents,
    isAuthenticated,
    isLoading,
    updateQty,
    removeItem,
  } = useCart();

  const [promo, setPromo] = useState<StoredPromo | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);

  useEffect(() => {
    setPromo(readStoredPromo());
  }, []);

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoMessage("Enter a code first.");
      return;
    }
    setPromoBusy(true);
    setPromoMessage("");
    const { data, error } = await supabase
      .from("promo_codes")
      .select("id, code, discount_percent, starts_at, ends_at, max_uses, used_count, is_active")
      .ilike("code", code)
      .maybeSingle();
    setPromoBusy(false);
    if (error || !data) {
      setPromoMessage("That code isn't valid.");
      return;
    }
    if (!data.is_active) {
      setPromoMessage("That code is currently disabled.");
      return;
    }
    const now = Date.now();
    if (data.starts_at && new Date(data.starts_at).getTime() > now) {
      setPromoMessage("That code isn't active yet.");
      return;
    }
    if (data.ends_at && new Date(data.ends_at).getTime() < now) {
      setPromoMessage("That code has expired.");
      return;
    }
    if (data.max_uses != null && data.used_count >= data.max_uses) {
      setPromoMessage("That code has been fully used.");
      return;
    }
    const next: StoredPromo = {
      id: data.id,
      code: data.code,
      percent: data.discount_percent,
    };
    setPromo(next);
    writeStoredPromo(next);
    setPromoInput("");
    setPromoMessage(`Applied — ${data.discount_percent}% off.`);
  }

  function clearPromo() {
    setPromo(null);
    writeStoredPromo(null);
    setPromoMessage("");
  }

  if (isLoading) {
    return (
      <section className="cartEmpty">
        <p className="eyebrow">Cart</p>
        <h1>Loading your cart…</h1>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="cartEmpty">
        <p className="eyebrow">Cart</p>
        <h1>Your cart is quiet.</h1>
        <p className="lede">
          Choose a candle from the cabinet — it will rest here until you&rsquo;re
          ready.
        </p>
        <Link className="button primary mt-2 inline-flex" href="/products">
          Browse the cabinet
        </Link>
      </section>
    );
  }

  const currency = items[0]?.currency ?? "EGP";
  const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);

  function onCheckout() {
    router.push("/checkout");
  }

  return (
    <section className="cartLayout">
      <header>
        <p className="eyebrow">Your cart</p>
        <h1>
          {itemCount === 1 ? "One candle" : `${itemCount} candles`} ready.
        </h1>
      </header>

      <ul className="cartLines">
        {items.map((line) => (
          <li className="cartLine" key={line.id}>
            <Link
              className="cartLineThumb"
              href={`/products/${line.productSlug}`}
            >
              {line.productImageUrl ? (
                <Image
                  alt={line.productName}
                  fill
                  sizes="110px"
                  src={line.productImageUrl}
                />
              ) : (
                <span className="grid h-full w-full place-items-center [font-family:var(--serif)] text-[0.7rem] italic">
                  Neuvesca
                </span>
              )}
            </Link>

            <div className="cartLineMeta">
              <Link
                className="cartLineName"
                href={`/products/${line.productSlug}`}
              >
                {line.productName}
              </Link>
              {line.scentSlug && line.scentName && (
                <span className="cartLineScent">{line.scentName}</span>
              )}
              <div className="cartLineActions">
                <div className="qtyStepper">
                  <button
                    aria-label="Decrease quantity"
                    disabled={line.quantity <= 1}
                    onClick={() => updateQty(line.id, line.quantity - 1)}
                    type="button"
                  >
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    aria-label="Increase quantity"
                    disabled={line.quantity >= 99}
                    onClick={() => updateQty(line.id, line.quantity + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <button
                  className="cartRemove"
                  onClick={() => removeItem(line.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>

            <span className="cartLinePrice">
              {formatPrice(line.quantity * line.unitPriceCents, line.currency)}
            </span>
          </li>
        ))}
      </ul>

      <aside className="cartSummary" aria-label="Order summary">
        <h3>Order summary</h3>

        <div className="cartPromo">
          {promo ? (
            <div className="cartPromoApplied">
              <span>
                <strong>{promo.code}</strong> · {promo.percent}% off
              </span>
              <button
                className="cartPromoClear"
                onClick={clearPromo}
                type="button"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="cartPromoForm">
              <input
                aria-label="Promo code"
                onChange={(e) => setPromoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                placeholder="Promo code"
                style={{ textTransform: "uppercase" }}
                value={promoInput}
              />
              <button
                className="cartPromoApply"
                disabled={promoBusy}
                onClick={applyPromo}
                type="button"
              >
                {promoBusy ? "…" : "Apply"}
              </button>
            </div>
          )}
          {promoMessage && <p className="cartPromoMessage">{promoMessage}</p>}
        </div>

        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotalCents, currency)}</dd>
          </div>
          {promo && (
            <div>
              <dt>Discount ({promo.percent}%)</dt>
              <dd>− {formatPrice(Math.round((subtotalCents * promo.percent) / 100), currency)}</dd>
            </div>
          )}
          <div>
            <dt>Shipping</dt>
            <dd>Calculated at checkout</dd>
          </div>
          <div className="cartTotal">
            <dt>Total</dt>
            <dd>
              {formatPrice(
                promo
                  ? subtotalCents - Math.round((subtotalCents * promo.percent) / 100)
                  : subtotalCents,
                currency,
              )}
            </dd>
          </div>
        </dl>
        <p>Tax included where applicable. Free shipping on orders over E£1,500.</p>
        <button
          className="button primary full"
          onClick={onCheckout}
          type="button"
        >
          Proceed to checkout
        </button>
        <Link className="tertiary mx-auto" href="/products">
          Continue shopping
        </Link>
      </aside>
    </section>
  );
}
