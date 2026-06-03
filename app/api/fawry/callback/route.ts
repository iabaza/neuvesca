import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Browser-side redirect from Fawry after the customer finishes (or aborts) the
 * hosted checkout. Fawry appends query params like:
 *   merchantRefNumber, orderStatus, fawryRefNumber, paymentAmount, ...
 *
 * Trust the server-to-server webhook for the source of truth; this handler
 * only routes the customer to the right success / cart page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const merchantRef = url.searchParams.get("merchantRefNumber") ?? "";
  const orderStatus =
    url.searchParams.get("orderStatus")?.toUpperCase() ?? "";
  const fawryRef = url.searchParams.get("fawryRefNumber") ?? "";

  let orderId = "";
  if (merchantRef) {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("fawry_merchant_ref_number", merchantRef)
      .maybeSingle();
    orderId = data?.id ?? "";

    // Persist the Fawry reference number on first sight (status updates are
    // handled by the webhook).
    if (orderId && fawryRef) {
      await supabase
        .from("orders")
        .update({ fawry_reference_number: fawryRef })
        .eq("id", orderId);
    }

    // Clear the cart now that the customer has reached the success page —
    // the order row already exists from createFawryCheckout.
    if (orderId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("cart_items").delete().eq("user_id", user.id);
      }
    }
  }

  const success =
    orderStatus === "PAID" ||
    orderStatus === "NEW" ||
    orderStatus === "UNPAID"; // UNPAID = awaiting Fawry reference payment

  const target = orderId
    ? success
      ? `/checkout/success?order=${orderId}`
      : `/cart?error=fawry`
    : "/cart";

  return NextResponse.redirect(new URL(target, url.origin));
}

export const POST = GET;
