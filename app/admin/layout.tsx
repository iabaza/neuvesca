import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "./AdminNav";

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export const metadata: Metadata = {
  title: "Admin | Neuvesca",
  description: "Neuvesca admin area.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/account");
  }

  return (
    <div className="adminShell">
      <aside className="adminSidebar">
        <Link className="adminBrand" href="/admin">
          <span className="adminBrandMark">N</span>
          <span>
            <span className="adminBrandTitle">NEUVESCA</span>
            <span className="adminBrandSub">admin</span>
          </span>
        </Link>

        <AdminNav />

        <div className="adminSidebarActions">
          <Link className="adminSidebarAction" href="/products">
            <svg aria-hidden fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24" width="16">
              <path d="M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10" />
            </svg>
            Back to store
          </Link>
          <form action={signOut}>
            <button className="adminSidebarAction" type="submit">
              <svg aria-hidden fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24" width="16">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sign out
            </button>
          </form>
        </div>

        <div className="adminProfile">
          <span className="adminProfileAvatar" aria-hidden>
            {(profile?.full_name || profile?.email || "A").slice(0, 1).toUpperCase()}
          </span>
          <span className="adminProfileMeta">
            <span className="adminProfileName">
              {profile?.full_name || "Admin"}
            </span>
            <span className="adminProfileEmail">{profile?.email}</span>
          </span>
        </div>
      </aside>
      <main className="adminMain">{children}</main>
    </div>
  );
}
