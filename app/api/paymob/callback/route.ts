import { NextResponse } from "next/server";
import { runAfterResponse } from "@/lib/background";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizePaymobCallbackQuery,
  verifyPaymobHmac,
} from "@/lib/payments/paymob";

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
  const rawFields: Record<string, unknown> = {};
  params.forEach((value, key) => {
    rawFields[key] = value;
  });

  // The redirect's raw query uses different key names than the webhook JSON
  // body (see normalizePaymobCallbackQuery) — normalize before verifying, or
  // the HMAC check silently fails for every payment, success included.
  const fields = normalizePaymobCallbackQuery(rawFields);
  const hmac = String(fields.hmac ?? "");

  const valid = verifyPaymobHmac(fields, hmac);
  const success = valid && fields.success === "true";
  const merchantOrderId = String(fields.merchant_order_id ?? "");

  if (!valid) {
    console.error(
      `[paymob/callback] HMAC verification failed for order ref="${merchantOrderId}"`,
    );
  }

  let orderId = "";
  if (merchantOrderId) {
    // Guest orders (no logged-in customer) have user_id = null, and RLS on
    // `orders` only lets an authenticated user read their own row — so the
    // regular session client silently sees no row here, indistinguishable
    // from the order not existing. Read with the admin client instead: the
    // HMAC check above already establishes this request is genuinely from
    // Paymob before any of this data is trusted.
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("orders")
      .select("id")
      .eq("paymob_merchant_order_id", merchantOrderId)
      .maybeSingle();
    orderId = data?.id ?? "";

    if (orderId && success) {
      // Cart-clearing is scoped to whoever the browser is actually logged in
      // as, so it stays on the session-aware client.
      runAfterResponse(clearCart(createClient()));
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
