import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account | Neuvesca",
  description: "Your Neuvesca account.",
};

async function signOut() {
  "use server";

  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="pageIntro pageIntroCentered">
      <p className="eyebrow">Account</p>
      <h1>Your Neuvesca account.</h1>
      <div className="protectedPanel">
        <dl className="protectedDetails">
          <div>
            <dt>Email</dt>
            <dd>{profile?.email ?? user.email}</dd>
          </div>
          <div>
            <dt>Name</dt>
            <dd>{profile?.full_name || "Not set"}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{profile?.role ?? "customer"}</dd>
          </div>
        </dl>
        <div className="protectedActions">
          {profile?.role === "admin" && (
            <Link className="button primary" href="/admin">
              Go to dashboard
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" className="button secondary">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
