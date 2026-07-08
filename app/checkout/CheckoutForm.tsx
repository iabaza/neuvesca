"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { formatPrice } from "@/lib/format";
import type { ServerCartLine } from "@/lib/queries/cart";
import { readStoredPromo, type StoredPromo } from "@/lib/cart/promo";
import { calculateShippingCents } from "@/lib/checkout/shipping";
import { createPaymobCheckout, placeOrder } from "./actions";

function PayNowButton({
  method,
  busy,
  onCardClick,
}: {
  method: "card" | "cod";
  busy: boolean;
  onCardClick: () => void;
}) {
  const { pending } = useFormStatus();
  const disabled = busy || pending;

  if (method === "card") {
    return (
      <button
        className="button primary mt-4 w-full"
        disabled={disabled}
        onClick={onCardClick}
        type="button"
      >
        {busy ? "Redirecting" : "Pay now"}
      </button>
    );
  }

  return (
    <button
      className="button primary mt-4 w-full"
      disabled={disabled}
      type="submit"
    >
      {pending ? "Placing order" : "Pay now"}
    </button>
  );
}

export default function CheckoutForm({
  cart,
  currency,
  subtotalCents,
  userEmail,
  error,
}: {
  cart: ServerCartLine[];
  currency: string;
  subtotalCents: number;
  userEmail: string;
  error?: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isStartingCard, setIsStartingCard] = useState(false);
  const [cardMessage, setCardMessage] = useState("");
  // Card payments are temporarily disabled — only COD for now.
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("cod");
  const [promo, setPromo] = useState<StoredPromo | null>(null);
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    setPromo(readStoredPromo());
  }, []);

  const discountCents = promo
    ? Math.round((subtotalCents * promo.percent) / 100)
    : 0;
  const shippingCents = calculateShippingCents(city, region);
  const totalCents =
    Math.max(0, subtotalCents - discountCents) + shippingCents;

  async function payWithCard() {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;

    setIsStartingCard(true);
    setCardMessage("");

    try {
      const result = await createPaymobCheckout(new FormData(form));
      if (!result.ok) {
        setCardMessage(result.error);
        setIsStartingCard(false);
        return;
      }
      window.location.href = result.iframeUrl;
    } catch (error) {
      setCardMessage(
        error instanceof Error
          ? error.message
          : "Card checkout could not start.",
      );
      setIsStartingCard(false);
    }
  }

  return (
    <form
      action={placeOrder}
      className="authForm mt-8 grid gap-5 bg-[var(--porcelain)] p-[clamp(1.5rem,3vw,2.5rem)] shadow-[var(--shadow-soft)]"
      ref={formRef}
    >
      {error && <p className="authMessage authError">{error}</p>}

      <label>
        <span>Full name</span>
        <input name="customer_name" required type="text" />
      </label>
      <label>
        <span>Email</span>
        <input
          defaultValue={userEmail}
          name="customer_email"
          required
          type="email"
        />
      </label>
      <label>
        <span>Mobile</span>
        <input
          name="customer_mobile"
          placeholder="+20 1xxxxxxxxx"
          required
          type="tel"
        />
      </label>
      <label>
        <span>Address line 1</span>
        <input name="shipping_address_line1" required type="text" />
      </label>
      <label>
        <span>Address line 2 (optional)</span>
        <input name="shipping_address_line2" type="text" />
      </label>
      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span>City</span>
          <input
            name="shipping_city"
            onChange={(e) => setCity(e.target.value)}
            required
            type="text"
            value={city}
          />
        </label>
        <label>
          <span>Governorate (optional)</span>
          <input
            name="shipping_region"
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. Cairo, Giza, Alexandria"
            type="text"
            value={region}
          />
        </label>
        <label>
          <span>Postal code</span>
          <input name="shipping_postal_code" required type="text" />
        </label>
        <label>
          <span>Country</span>
          <input name="shipping_country" required type="text" />
        </label>
      </div>

      <div className="mt-2 grid gap-4 border-t border-[var(--line-soft)] pt-4">
        <div className="grid gap-2">
          <p className="eyebrow !mb-0">Payment</p>
          <p className="text-[0.85rem] text-[var(--ink-soft)]">
            Your payment method&rsquo;s billing address must match the shipping
            address. All transactions are secure and encrypted.
          </p>
          {promo && (
            <p className="text-[0.85rem] text-[var(--ink-soft)]">
              Promo <strong>{promo.code}</strong> applied — {promo.percent}% off (− {formatPrice(discountCents, currency)})
            </p>
          )}
          <p className="text-[0.85rem] text-[var(--muted)]">
            Shipping: {formatPrice(shippingCents, currency)}
            {city || region ? "" : " (Cairo 100 EGP · Other 130 EGP)"}
          </p>
          <p className="text-[0.85rem] text-[var(--muted)]">
            Total due: {formatPrice(totalCents, currency)}
          </p>
        </div>

        <div className="grid gap-3">
          <label
            className="flex items-start gap-3 border border-[var(--line)] bg-[var(--cream)] p-4 opacity-60"
            title="Card payment is temporarily disabled"
          >
            <input
              checked={false}
              className="mt-1"
              disabled
              name="payment_choice"
              readOnly
              type="radio"
              value="card"
            />
            <div className="grid gap-1">
              <span className="text-[0.95rem]">
                Pay via (Debit/Credit cards/Wallets/Installments)
              </span>
              <span className="text-[0.78rem] uppercase tracking-[0.2em] text-[var(--muted)]">
                Coming soon
              </span>
            </div>
          </label>

          <label
            className="flex cursor-pointer items-start gap-3 border border-[var(--ink)] bg-[var(--cream)] p-4"
          >
            <input
              checked={paymentMethod === "cod"}
              className="mt-1"
              name="payment_choice"
              onChange={() => setPaymentMethod("cod")}
              type="radio"
              value="cod"
            />
            <span className="text-[0.95rem]">Cash on Delivery (COD)</span>
          </label>
        </div>

        {cardMessage && (
          <p className="authMessage" role="status">
            {cardMessage}
          </p>
        )}

        <PayNowButton
          busy={isStartingCard}
          method={paymentMethod}
          onCardClick={payWithCard}
        />
      </div>

      <input
        name="cart_snapshot"
        readOnly
        type="hidden"
        value={JSON.stringify(
          cart.map((line) => ({
            productId: line.productId,
            scentId: line.scentId,
            quantity: line.quantity,
          })),
        )}
      />
      <input
        name="promo_code"
        readOnly
        type="hidden"
        value={promo?.code ?? ""}
      />
    </form>
  );
}
