import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServerCart } from "@/lib/queries/cart";
import { formatPrice } from "@/lib/format";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout | Neuvesca",
  description: "Complete your Neuvesca order.",
};

type SearchParams = { error?: string };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/checkout");

  const cart = await getServerCart(user.id);
  if (cart.length === 0) redirect("/cart");

  const currency = cart[0].currency;
  const subtotalCents = cart.reduce(
    (n, l) => n + l.quantity * l.unitPriceCents,
    0,
  );

  return (
    <section className="mx-auto grid max-w-[1080px] gap-10 px-[clamp(1.25rem,5vw,5.5rem)] py-[clamp(3rem,6vw,6rem)] lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="eyebrow">Checkout</p>
        <h1 className="!text-[clamp(2.4rem,4vw,3.6rem)]">
          Shipping &amp; payment.
        </h1>
        <p className="lede">
          Pay with Fawry Pay, by card, or cash on delivery — then we&rsquo;ll
          get the pour boxed.
        </p>

        <CheckoutForm
          cart={cart}
          currency={currency}
          error={searchParams?.error}
          subtotalCents={subtotalCents}
          userEmail={user.email ?? ""}
        />
      </div>

      <aside className="grid h-fit gap-5 border border-[var(--line)] bg-[var(--cream)] p-[clamp(1.5rem,3vw,2.5rem)]">
        <p className="eyebrow !mb-0">Order summary</p>
        <ul className="grid gap-4">
          {cart.map((line) => (
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
            <span>Calculated on delivery</span>
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
