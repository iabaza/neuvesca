"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart/CartProvider";

const leftLinks = [
  { href: "/products", label: "Shop" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/about", label: "Our story" },
];

const rightLinks = [{ href: "/contact", label: "Contact" }];

type SiteHeaderNavProps = {
  initialCount: number;
  isAuthenticated: boolean;
};

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      <path d={d} />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      <path d="M6.5 8.5h11l1 11h-13l1-11Z" />
      <path d="M9 8.5a3 3 0 0 1 6 0" />
    </svg>
  );
}

function NavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isHashLink = href.startsWith("/#");
  const isActive =
    !isHashLink && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={[
        "relative py-1 text-[0.72rem] font-normal uppercase tracking-[0.24em] text-[var(--ink-soft)] transition-colors",
        "after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[var(--ink)] after:transition-transform after:duration-300",
        "hover:text-[var(--ink)] hover:after:scale-x-100",
        isActive ? "text-[var(--ink)] after:scale-x-100" : "",
      ].join(" ")}
      href={href}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}

export default function SiteHeaderNav({
  initialCount,
  isAuthenticated,
}: SiteHeaderNavProps) {
  const navPath = usePathname();
  const { count, isLoading } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change.
  useEffect(() => {
    setDrawerOpen(false);
  }, [navPath]);

  // Lock body scroll while drawer open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  if (navPath?.startsWith("/admin")) return null;

  const displayCount = isLoading ? initialCount : count;
  const accountHref = isAuthenticated ? "/account" : "/login";
  const accountLabel = isAuthenticated ? "Account" : "Login";

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line-soft)] bg-[var(--paper)]">
      <div className="bg-[var(--ink)] px-4 py-3 text-center text-[0.7rem] font-normal uppercase tracking-[0.28em] text-[var(--cream)] max-sm:text-[0.62rem] max-sm:tracking-[0.22em]">
        Spring pours now resting in the Neuvesca
      </div>

      {/* Desktop nav */}
      <nav
        aria-label="Main navigation"
        className="mx-auto hidden min-h-[88px] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-[clamp(1.5rem,5vw,4rem)] lg:grid"
      >
        <div className="flex flex-wrap justify-start gap-[clamp(1.4rem,3vw,3rem)]">
          {leftLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </div>

        <Link
          aria-label="Neuvesca home"
          className="text-center [font-family:var(--serif)] text-[clamp(1.4rem,2.1vw,1.85rem)] font-normal leading-none tracking-[0.32em] text-[var(--ink)] transition-colors hover:text-[var(--clay)]"
          href="/"
        >
          NEUVESCA
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-[clamp(1.1rem,2.4vw,2.4rem)]">
          {rightLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}

          <Link
            aria-label={`Cart with ${displayCount} ${
              displayCount === 1 ? "item" : "items"
            }`}
            className="inline-flex items-center gap-2 py-1 text-[0.72rem] font-normal uppercase tracking-[0.2em] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
            href="/cart"
          >
            <CartIcon className="h-4 w-4" />
            <span className="grid h-6 min-w-6 place-items-center rounded-full border border-[var(--line)] px-1 text-[0.65rem] tracking-normal">
              {displayCount}
            </span>
          </Link>

          <NavLink href={accountHref} label={accountLabel} />
        </div>
      </nav>

      {/* Mobile nav */}
      <nav
        aria-label="Main navigation"
        className="grid grid-cols-3 items-center px-5 py-4 lg:hidden"
      >
        <div className="flex items-center gap-4 justify-self-start text-[var(--ink)]">
          <button
            aria-expanded={drawerOpen}
            aria-label="Open menu"
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--cream)]"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <Icon className="h-5 w-5" d="M4 7h16M4 12h16M4 17h16" />
          </button>
          <Link
            aria-label="Search"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--cream)]"
            href="/products"
          >
            <Icon
              className="h-5 w-5"
              d="M11 19a8 8 0 1 1 5.3-14 8 8 0 0 1-5.3 14Zm6.6-2.4L21 20"
            />
          </Link>
        </div>

        <Link
          aria-label="Neuvesca home"
          className="justify-self-center text-center [font-family:var(--serif)] text-[1.25rem] font-normal leading-none tracking-[0.3em] text-[var(--ink)]"
          href="/"
        >
          NEUVESCA
        </Link>

        <div className="flex items-center gap-3 justify-self-end text-[var(--ink)]">
          <Link
            aria-label={accountLabel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--cream)]"
            href={accountHref}
          >
            <Icon
              className="h-5 w-5"
              d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0"
            />
          </Link>
          <Link
            aria-label={`Cart with ${displayCount} ${
              displayCount === 1 ? "item" : "items"
            }`}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--cream)]"
            href="/cart"
          >
            <CartIcon className="h-5 w-5" />
            {displayCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--ink)] px-1 text-[0.6rem] font-medium leading-none text-[var(--cream)]">
                {displayCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        aria-hidden={!drawerOpen}
        className={[
          "fixed inset-0 z-40 lg:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
      >
        <button
          aria-label="Close menu"
          className={[
            "absolute inset-0 bg-[var(--ink)]/40 transition-opacity duration-300",
            drawerOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setDrawerOpen(false)}
          tabIndex={drawerOpen ? 0 : -1}
          type="button"
        />
        <aside
          className={[
            "absolute left-0 top-0 flex h-full w-[78%] max-w-[320px] flex-col gap-6 bg-[var(--paper)] px-6 pb-8 pt-6 shadow-[0_30px_80px_-30px_rgba(31,26,20,0.4)] transition-transform duration-300",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <span className="[font-family:var(--serif)] text-[1.2rem] tracking-[0.3em] text-[var(--ink)]">
              NEUVESCA
            </span>
            <button
              aria-label="Close menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--cream)]"
              onClick={() => setDrawerOpen(false)}
              type="button"
            >
              <Icon className="h-5 w-5" d="M6 6l12 12M18 6 6 18" />
            </button>
          </div>

          <div className="flex flex-col gap-1 border-t border-[var(--line-soft)] pt-4">
            {[...leftLinks, ...rightLinks].map((link) => (
              <Link
                className="py-3 text-[0.78rem] font-normal uppercase tracking-[0.26em] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                href={link.href}
                key={link.href}
                onClick={() => setDrawerOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              className="py-3 text-[0.78rem] font-normal uppercase tracking-[0.26em] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
              href={accountHref}
              onClick={() => setDrawerOpen(false)}
            >
              {accountLabel}
            </Link>
            <Link
              className="py-3 text-[0.78rem] font-normal uppercase tracking-[0.26em] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
              href="/cart"
              onClick={() => setDrawerOpen(false)}
            >
              Cart ({displayCount})
            </Link>
          </div>
        </aside>
      </div>
    </header>
  );
}
