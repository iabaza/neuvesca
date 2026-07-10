import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping | Neuvesca",
  description:
    "Shipping rates, delivery times, and coverage for Neuvesca orders across Egypt.",
};

export default function ShippingPage() {
  return (
    <>
      <section className="pageIntro pageIntroCentered">
        <p className="eyebrow">Delivery</p>
        <h1>Shipping</h1>
        <p className="lede">We deliver all over Egypt.</p>
      </section>

      <section className="section returnsBody">
        <article className="returnsBlock">
          <h2>Delivery times</h2>
          <p>
            All shipping timelines exclude weekends and public holidays.
          </p>
          <ul>
            <li>
              <strong>Standard shipping —</strong> 5–10 working days.
            </li>
            <li>
              <strong>Next-day delivery —</strong> available on request. Email{" "}
              <a href="mailto:neuvescacosmetics@gmail.com">
                neuvescacosmetics@gmail.com
              </a>{" "}
              for next-day or business delivery enquiries.
            </li>
          </ul>
        </article>

        <article className="returnsBlock">
          <h2>Shipping fees</h2>
          <ul>
            <li>
              <strong>Cairo —</strong> EGP 100
            </li>
            <li>
              <strong>All other governorates —</strong> EGP 130
            </li>
          </ul>
          <p>Free shipping on orders over EGP 1,500.</p>
        </article>

        <article className="returnsBlock">
          <h2>Coverage</h2>
          <p>
            We ship to all governorates across Egypt. If you have a question
            about a specific area or need a business delivery, please contact us
            at{" "}
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
