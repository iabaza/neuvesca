import type { Metadata } from "next";
import Link from "next/link";
import { login } from "./actions";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export const metadata: Metadata = {
  title: "Sign In | Neuvesca",
  description: "Sign in to your Neuvesca account.",
};

type LoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
  };
};

function getNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/products";
  if (next.startsWith("/login") || next.startsWith("/signup")) return "/products";

  return next;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const next = getNext(searchParams?.next);

  return (
    <section className="authSplit">
      <aside className="authVisual">
        <div className="authVisualCopy">
          <p className="eyebrow">A quiet ritual</p>
          <h2>Your candle cabinet, kept close.</h2>
          <p>
            Saved scents, slow recipes, and the occasional letter from the
            studio.
          </p>
        </div>
      </aside>

      <div className="authPane">
        <div className="authCard">
          <div className="authIntro">
            <p className="eyebrow">Account</p>
            <h1>Welcome back.</h1>
            <p className="lede">
              Sign in to keep your cart, orders, and slow rituals close.
            </p>
          </div>

          {searchParams?.error ? (
            <p className="authMessage authError">{searchParams.error}</p>
          ) : null}

          <form className="authForm" action={login}>
            <input type="hidden" name="next" value={next} />

            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="Your password"
                required
              />
            </label>

            <button type="submit" className="button primary full">
              Sign in
            </button>
          </form>

          <div className="authDivider">or</div>
          <GoogleSignInButton next={next} />

          <p className="authSwitch">
            New to Neuvesca? <Link href="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
