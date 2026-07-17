import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Neuvesca",
  description:
    "Write to the Neuvesca studio — for orders, custom pours, press, and quiet conversations.",
};

export default function ContactPage() {
  return (
    <>
      <section className="pageIntro pageIntroCentered">
        <p className="eyebrow">Write to us</p>
        <h1>We answer slowly, and always.</h1>
        <p className="lede">
          Have an inquiry? Email us and we&rsquo;ll be in touch as soon as we
          can.
        </p>
      </section>

      <section
        className="contactPanel"
        style={{
          padding: "clamp(3rem, 6vw, 6rem) clamp(1.25rem, 5vw, 5.5rem)",
        }}
      >
        <form
          className="contactForm"
          style={{
            margin: "0 auto",
            maxWidth: "640px",
            width: "100%",
          }}
        >
          <div
            className="contactFormHeader"
            style={{ textAlign: "center", marginBottom: "1.5rem" }}
          >
            <p className="eyebrow" style={{ margin: "0 0 0.9rem" }}>
              Leave a note
            </p>
            <h2 style={{ margin: "0 auto", maxWidth: "22ch" }}>
              Tell us what you&rsquo;re looking for.
            </h2>
          </div>

          <div className="contactRow">
            <label>
              <span>Name</span>
              <input type="text" name="name" placeholder="Your name" required />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </label>
          </div>

          <label>
            <span>Subject</span>
            <span className="fancySelect">
              <select name="subject" defaultValue="arrival">
                <option value="arrival">When will my order arrive?</option>
                <option value="returns">
                  Do you offer returns or exchanges?
                </option>
                <option value="shipping">How long does shipping take?</option>
                <option value="modify">
                  Can I modify or cancel my order?
                </option>
              </select>
            </span>
          </label>

          <label>
            <span>Message</span>
            <textarea
              name="message"
              rows={6}
              placeholder="A few sentences is plenty."
              required
            />
          </label>

          <button type="submit" className="button primary full">
            Send the note
          </button>
        </form>

        <div
          className="contactDetails"
          style={{
            margin: "clamp(2.5rem, 5vw, 4rem) auto 0",
            maxWidth: "640px",
            display: "block",
            textAlign: "center",
          }}
        >
          <div className="contactItem" style={{ border: 0 }}>
            <p className="eyebrow">Direct</p>
            <p className="contactLine">
              <a href="mailto:neuvescacosmetics@gmail.com">
                neuvescacosmetics@gmail.com
              </a>
            </p>
            <p className="contactLine" style={{ marginTop: "0.6rem" }}>
              <a
                href="https://wa.me/201200265774"
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
