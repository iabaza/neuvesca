"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart/CartProvider";
import CheckoutForm from "./CheckoutForm";

type Props = {
  userEmail: string;
  error?: string;
};

export default function CheckoutView({ userEmail, error }: Props) {
  const router = useRouter();
  const { items, isLoading, subtotalCents } = useCart();

  useEffect(() => {
    if (!isLoading && items.length === 0) {
      router.replace("/cart");
    }
  }, [isLoading, items.length, router]);

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
            currency: line.currency,
            quantity: line.quantity,
          }))}
          currency={currency}
          error={error}
          subtotalCents={subtotalCents}
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
          <div className="flex items-baseline justify-between text-[var(--muted)]">
            <span>Shipping</span>
            <span>Cairo 100 EGP · Other 130 EGP</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-[var(--line)] pt-3">
            <span className="eyebrow !mb-0">Total</span>
            <span className="[font-family:var(--serif)] text-[1.6rem] italic">
              {formatPrice(subtotalCents, currency)}
            </span>
          </div>
        </div>
      </aside>
    </section>
  );
}
