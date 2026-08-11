import { NextResponse } from "next/server";
import { runAfterResponse } from "@/lib/background";
import { createClient } from "@/lib/supabase/server";
import { verifyPaymobHmac } from "@/lib/payments/paymob";

/**
 * Browser redirect after Paymob's hosted checkout completes (or fails).
 * Paymob appends transaction fields + ?hmac=... to the configured return URL.
 *
 * We trust the server-to-server webhook for the source of truth — this route
 * only routes the customer to the right page.
 *
 * Paymob treats a response slower than 5 seconds as a failed integration, so
 * the response path does the minimum needed to build the redirect. Clearing the
 * cart is deferred to waitUntil: the customer must not wait on it, but it still
 * has to run, and a bare floating promise would be killed when the lambda is
 * frozen after the redirect is sent.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const fields: Record<string, unknown> = {};
  params.forEach((value, key) => {
    fields[key] = value;
  });

  // TEMP DIAGNOSTIC: log every field Paymob actually sends on this redirect,
  // so the real key names can be confirmed instead of assumed. Remove once
  // the reference field is confirmed and the reader below is fixed to match.
  console.log("[paymob/callback] raw query keys:", Object.keys(fields).join(","));
  console.log("[paymob/callback] raw query:", JSON.stringify(fields));

  const hmac = String(fields.hmac ?? "");

  const valid = verifyPaymobHmac(fields, hmac);
  const success = valid && fields.success === "true";
  const merchantOrderId = String(
    fields.merchant_order_id ??
      fields["order.merchant_order_id"] ??
      fields.special_reference ??
      fields["order.special_reference"] ??
      "",
  );

  console.log(
    `[paymob/callback] valid=${valid} success=${success} merchantOrderId="${merchantOrderId}"`,
  );

  let orderId = "";
  if (merchantOrderId) {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("paymob_merchant_order_id", merchantOrderId)
      .maybeSingle();
    orderId = data?.id ?? "";

    if (orderId && success) {
      runAfterResponse(clearCart(supabase));
    }
  }

  const target = orderId
    ? success
      ? `/checkout/success?order=${orderId}`
      : `/cart?error=card`
    : "/cart";

  return NextResponse.redirect(new URL(target, url.origin));
}

async function clearCart(supabase: ReturnType<typeof createClient>) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
    }
  } catch (err) {
    console.error(
      "[paymob/callback] clearing cart failed:",
      err instanceof Error ? err.message : err,
    );
  }
}
