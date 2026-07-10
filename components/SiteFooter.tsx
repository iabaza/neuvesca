import Link from "next/link";

const linkClass =
  "border-b border-transparent pb-1 text-[0.7rem] font-normal uppercase tracking-[0.26em] text-[rgba(250,244,232,0.7)] transition-colors hover:border-[rgba(250,244,232,0.5)] hover:text-[var(--cream)]";

const columnHeadingClass =
  "mb-4 text-[0.72rem] font-normal uppercase tracking-[0.32em] text-[var(--cream)]";

export default function SiteFooter() {
  return (
    <footer
      className="grid items-start gap-[clamp(2.5rem,4vw,4rem)] bg-[var(--ink)] px-[clamp(1.5rem,5vw,5.5rem)] py-[clamp(5rem,8vw,9rem)] text-[var(--cream)] md:grid-cols-[1fr_minmax(280px,480px)] max-sm:px-5"
      id="letter"
    >
      <div>
        <div className="[font-family:var(--serif)] text-[clamp(1.4rem,2.1vw,1.9rem)] font-normal leading-none tracking-[0.32em] text-[var(--cream)]">
          NEUVESCA
        </div>
        <p className="mt-4 max-w-[26rem] [font-family:var(--serif)] text-[1.15rem] italic text-[rgba(250,244,232,0.6)]">
          A body serum candle made specifically for your skin.
        </p>

        <div className="mt-9 grid gap-10 sm:grid-cols-3">
          <div>
            <p className={columnHeadingClass}>Shop</p>
            <ul className="grid gap-3">
              <li>
                <Link className={linkClass} href="/products#candles">
                  Candles
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/products#bundles">
                  Bundles
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/products#accessories">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className={columnHeadingClass}>Social</p>
            <ul className="grid gap-3">
              <li>
                <a
                  className={linkClass}
                  href="https://www.instagram.com/neuvesca?igsh=MWJhNDlhYmtnOTZnbQ%3D%3D&utm_source=qr"
                  rel="noreferrer"
                  target="_blank"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  className={linkClass}
                  href="https://www.tiktok.com/@neuvesca?_r=1&_t=ZS-96MU61U39eP"
                  rel="noreferrer"
                  target="_blank"
                >
                  Tik Tok
                </a>
              </li>
              <li>
                <a
                  className={linkClass}
                  href="mailto:neuvescacosmetics@gmail.com"
                >
                  Email
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className={columnHeadingClass}>Info</p>
            <ul className="grid gap-3">
              <li>
                <Link className={linkClass} href="/about">
                  Our story
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/contact">
                  Contact
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/shipping">
                  Shipping
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/returns">
                  Return policy
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/privacy">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <form className="grid gap-3">
        <label
          className="[font-family:var(--serif)] text-[1.55rem] italic text-[var(--cream)]"
          htmlFor="email"
        >
          Join the ritual
        </label>
        <p className="mb-2 max-w-[28rem] text-[0.88rem] leading-[1.65] text-[rgba(250,244,232,0.55)]">
          Updates on new releases, ingredients, and the rituals behind each
          pour.
        </p>
        <div className="flex gap-3 max-sm:flex-col">
          <input
            className="min-h-[52px] flex-1 border-0 border-b border-[rgba(250,244,232,0.3)] bg-transparent px-1 text-[var(--cream)] outline-none placeholder:text-[rgba(250,244,232,0.4)] focus:border-[var(--cream)]"
            id="email"
            placeholder="Email address"
            type="email"
          />
          <button
            className="inline-flex min-h-[52px] cursor-pointer items-center justify-center border border-[var(--cream)] bg-transparent px-7 py-4 text-[0.72rem] font-normal uppercase tracking-[0.26em] text-[var(--cream)] transition-colors hover:bg-[var(--cream)] hover:text-[var(--ink)] max-sm:w-full"
            type="submit"
          >
            Subscribe
          </button>
        </div>
      </form>

      <div className="col-span-full mt-[clamp(1.5rem,3vw,2.5rem)] flex justify-between gap-6 border-t border-[rgba(250,244,232,0.15)] pt-[clamp(2.5rem,4vw,3.5rem)] text-[0.7rem] uppercase tracking-[0.26em] text-[rgba(250,244,232,0.5)] max-sm:flex-col max-sm:gap-3">
        <span>Neuvesca &middot; Cairo, Egypt</span>
        <span>Poured by hand &middot; Shipped slowly</span>
      </div>
    </footer>
  );
}
