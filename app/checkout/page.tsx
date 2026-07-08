import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CheckoutView from "./CheckoutView";

export const metadata: Metadata = {
  title: "Checkout | Neuvesca",
  description: "Complete your Neuvesca order.",
};

type SearchParams = { error?: string };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <CheckoutView error={searchParams?.error} userEmail={user?.email ?? ""} />
  );
}
