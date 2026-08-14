"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart/CartProvider";
import { trackInitiateCheckout } from "@/lib/analytics/meta";
import { calculateShippingCents } from "@/lib/checkout/shipping";
import { readStoredPromo, type StoredPromo } from "@/lib/cart/promo";
import CheckoutForm from "./CheckoutForm";

type Props = {
  userEmail: string;
  error?: string;
};

export default function CheckoutView({ userEmail, error }: Props) {
  const router = useRouter();
  const { items, isLoading, subtotalCents } = useCart();

  // City/region/promo are lifted up from CheckoutForm (which owns the actual
  // inputs) so the order-summary card on the right can compute shipping and
  // the total from the same values the form itself uses — previously this
  // card hardcoded a static "Cairo 100 EGP · Other 130 EGP" label and never
  // added shipping to the displayed total at all, disagreeing with the
  // correct total shown inside the form.
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [promo, setPromo] = useState<StoredPromo | null>(null);

  useEffect(() => {
    setPromo(readStoredPromo());
  }, []);

  const discountCents = promo
    ? Math.round((subtotalCents * promo.percent) / 100)
    : 0;
  const shippingCents = calculateShippingCents(city, region);
  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;

  useEffect(() => {
    if (!isLoading && items.length === 0) {
      router.replace("/cart");
    }
  }, [isLoading, items.length, router]);

  // Meta "InitiateCheckout". Fires once the cart has actually hydrated, and
  // only once per visit to this page — the effect re-runs as cart state
  // settles, and a repeated event would overstate checkout starts.
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (isLoading || items.length === 0 || checkoutTracked.current) return;
    checkoutTracked.current = true;
    trackInitiateCheckout({
      contentIds: items.map((i) => i.productId),
      numItems: items.reduce((n, i) => n + i.quantity, 0),
      valueCents: subtotalCents,
      currency: items[0].currency,
    });
  }, [isLoading, items, subtotalCents]);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-[720px] px-[clamp(1.25rem,5vw,5.5rem)] py-[clamp(3rem,6vw,6rem)]">
        <p className="eyebrow">Checkout</p>
        <p className="text-[var(--muted)]">Loading your cart…</p>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const currency = items[0].currency;

  return (
    <section className="mx-auto grid max-w-[1080px] gap-10 px-[clamp(1.25rem,5vw,5.5rem)] py-[clamp(3rem,6vw,6rem)] lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="eyebrow">Checkout</p>
        <h1 className="!text-[clamp(2.4rem,4vw,3.6rem)]">
          Shipping &amp; payment.
        </h1>
        <p className="lede">
          Pay cash on delivery — we&rsquo;ll get the pour boxed and shipped.
        </p>

        <CheckoutForm
          cart={items.map((line) => ({
            id: line.id,
            productId: line.productId,
            productSlug: line.productSlug,
            productName: line.productName,
            productFamily: null,
            productImageUrl: line.productImageUrl,
            productTone: line.productTone,
            scentId: line.scentId,
            scentSlug: line.scentSlug,
            scentName: line.scentName,
            unitPriceCents: line.unitPriceCents,
            listPriceCents: line.listPriceCents,
            discountPercent: line.discountPercent,
            currency: line.currency,
            quantity: line.quantity,
          }))}
          city={city}
          currency={currency}
          discountCents={discountCents}
          error={error}
          onCityChange={setCity}
          onRegionChange={setRegion}
          promo={promo}
          region={region}
          shippingCents={shippingCents}
          subtotalCents={subtotalCents}
          totalCents={totalCents}
          userEmail={userEmail}
        />
      </div>

      <aside className="grid h-fit gap-5 border border-[var(--line)] bg-[var(--cream)] p-[clamp(1.5rem,3vw,2.5rem)]">
        <p className="eyebrow !mb-0">Order summary</p>
        <ul className="grid gap-4">
          {items.map((line) => (
            <li
              className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] pb-4 last:border-b-0 last:pb-0"
              key={line.id}
            >
              <div className="grid gap-1">
                <span className="[font-family:var(--serif)] text-[1.05rem] italic">
                  {line.productName}
                </span>
                <span className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                  {line.scentName ? `${line.scentName} x` : "x"}
                  {line.quantity}
                </span>
              </div>
              <span className="[font-family:var(--serif)] text-[1.05rem] italic">
                {formatPrice(line.quantity * line.unitPriceCents, line.currency)}
              </span>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 border-t border-[var(--line-soft)] pt-4">
          <div className="flex items-baseline justify-between text-[var(--muted)]">
            <span>Subtotal</span>
            <span>{formatPrice(subtotalCents, currency)}</span>
          </div>
          {promo && discountCents > 0 && (
            <div className="flex items-baseline justify-between text-[var(--muted)]">
              <span>Promo ({promo.code})</span>
              <span>− {formatPrice(discountCents, currency)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between text-[var(--muted)]">
            <span>Shipping</span>
            <span>
              {city || region
                ? formatPrice(shippingCents, currency)
                : "Cairo 100 EGP · Other 130 EGP"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-[var(--line)] pt-3">
            <span className="eyebrow !mb-0">Total</span>
            <span className="[font-family:var(--serif)] text-[1.6rem] italic">
              {formatPrice(totalCents, currency)}
            </span>
          </div>
        </div>
      </aside>
    </section>
  );
}
