import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "./AdminNav";

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
