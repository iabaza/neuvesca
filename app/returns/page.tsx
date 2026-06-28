import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return policy | Neuvesca",
  description:
    "Returns, exchanges, and damaged-order policy for Neuvesca body serum candles.",
};

export default function ReturnsPage() {
  return (
    <>
      <section className="pageIntro pageIntroCentered">
        <p className="eyebrow">Policy</p>
        <h1>Returns &amp; exchanges</h1>
        <p className="lede">
          We want you to love your Neuvesca experience. Here&rsquo;s how
          returns, exchanges, and damaged-in-transit orders are handled.
        </p>
      </section>

      <section className="section returnsBody">
        <article className="returnsBlock">
          <h2>1. Returns &amp; exchanges</h2>
          <p>
            We accept returns or exchanges within <strong>14 days</strong> of
            delivery under the following conditions:
          </p>
          <ul>
            <li>
              <strong>Unused condition:</strong> due to the cosmetic and
              hygienic nature of body serum candles, items must be entirely
              unused, unlit, and in their original, undamaged luxury packaging.
            </li>
            <li>
              <strong>Hygiene seals:</strong> any products with broken safety
              seals or signs of handling cannot be accepted for a return or
              refund.
            </li>
          </ul>
        </article>

        <article className="returnsBlock">
          <h2>2. Damaged, melted, or incorrect orders</h2>
          <p>
            We take immense care in packaging our serum candles, but we
            understand that transit can sometimes be rough — especially in warm
            weather. If your order arrives damaged, broken, melted, or
            incorrect, please notify us within <strong>48 hours</strong> of
            delivery at{" "}
            <a href="mailto:neuvescacosmetics@gmail.com">
              neuvescacosmetics@gmail.com
            </a>
            .
          </p>
        </article>
      </section>
    </>
  );
}
