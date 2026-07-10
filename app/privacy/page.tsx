import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy | Neuvesca",
  description:
    "How Neuvesca collects, uses, and protects your personal data, including Paymob payment processing.",
};

export default function PrivacyPage() {
  return (
    <>
      <section className="pageIntro pageIntroCentered">
        <p className="eyebrow">Legal</p>
        <h1>Privacy policy</h1>
        <p className="lede">Effective date: July 8, 2026</p>
      </section>

      <section className="section returnsBody">
        <article className="returnsBlock">
          <p>
            At Neuvesca, we respect your privacy and are committed to protecting
            your personal data. This Privacy Policy outlines how we collect,
            use, disclose, and safeguard your information when you visit our
            website and purchase our handcrafted candles and products.
          </p>
          <p>
            By using our website, you agree to the collection and use of
            information in accordance with this policy.
          </p>
        </article>

        <article className="returnsBlock">
          <h2>1. Information we collect</h2>
          <p>
            We collect information that is necessary to fulfill your orders and
            improve your shopping experience. This includes:
          </p>
          <ul>
            <li>
              <strong>Personal identifiable information:</strong> Name, shipping
              address, billing address, email address, and phone number.
            </li>
            <li>
              <strong>Payment information:</strong> When you make a purchase,
              your payment details are processed securely. We do not store your
              credit/debit card details on our servers. All payments are
              processed securely through our authorized payment gateway
              provider,{" "}
              <strong>Paymob</strong>.
            </li>
            <li>
              <strong>Technical data:</strong> IP address, browser type, time
              zone settings, and usage data collected via cookies to optimize
              website performance.
            </li>
          </ul>
        </article>

        <article className="returnsBlock">
          <h2>2. How we use your information</h2>
          <p>We use the data we collect to:</p>
          <ul>
            <li>Process, fulfill, and ship your orders.</li>
            <li>
              Send order confirmations, tracking details, and customer support
              updates.
            </li>
            <li>Process secure payments and prevent fraudulent transactions.</li>
            <li>
              Comply with legal and regulatory obligations in Egypt.
            </li>
            <li>
              Send promotional emails or updates about new candle collections
              (only if you have opted in).
            </li>
          </ul>
        </article>

        <article className="returnsBlock">
          <h2>3. Sharing your information with third parties</h2>
          <p>
            We do not sell, trade, or rent your personal data to third parties.
            However, we must share essential data with trusted service providers
            to complete your orders, including:
          </p>
          <ul>
            <li>
              <strong>Payment gateways (Paymob):</strong> To securely process
              your credit card, mobile wallet, or cash-on-delivery payments.
            </li>
            <li>
              <strong>Shipping &amp; courier services:</strong> To deliver your
              candles to your specified address.
            </li>
            <li>
              <strong>Analytics providers:</strong> To help us understand
              website traffic and improve our services.
            </li>
          </ul>
        </article>

        <article className="returnsBlock">
          <h2>4. Data security &amp; secure payment processing</h2>
          <p>
            We implement rigorous security measures to protect your personal
            information.
          </p>
          <ul>
            <li>
              All sensitive payment transactions are encrypted using Secure
              Socket Layer (SSL) technology.
            </li>
            <li>
              Your payment is handled directly by Paymob, a Central Bank of
              Egypt (CBE) regulated payment gateway. Neuvesca employees do not
              have access to, nor do we store, your full card numbers or CVV
              codes.
            </li>
          </ul>
        </article>

        <article className="returnsBlock">
          <h2>5. Cookies</h2>
          <p>
            We use cookies to enhance your browsing experience, remember the
            items in your shopping cart, and analyze our website traffic. You
            can choose to disable cookies through your browser settings, but
            some features of the site may not function properly as a result.
          </p>
        </article>

        <article className="returnsBlock">
          <h2>6. Your rights</h2>
          <p>
            You have the right to access, correct, or request the deletion of
            the personal information we hold about you. If you wish to update
            your details or have your data removed from our system, please
            contact us at{" "}
            <a href="mailto:neuvescacosmetics@gmail.com">
              neuvescacosmetics@gmail.com
            </a>
            .
          </p>
        </article>

        <article className="returnsBlock">
          <h2>7. Changes to this privacy policy</h2>
          <p>
            We reserve the right to update this Privacy Policy at any time to
            reflect changes in our practices or regulatory requirements. Any
            updates will be posted on this page with a revised effective date.
          </p>
        </article>

        <article className="returnsBlock">
          <h2>8. Contact us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy or
            how your data is handled, please reach out:
          </p>
          <ul>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:neuvescacosmetics@gmail.com">
                neuvescacosmetics@gmail.com
              </a>
            </li>
            <li>
              <strong>Website:</strong>{" "}
              <a href="https://www.neuvesca.com">www.neuvesca.com</a>
            </li>
          </ul>
        </article>
      </section>
    </>
  );
}
