import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyPaymobHmac } from "@/lib/payments/paymob";

/**
 * Browser redirect after Paymob's hosted iframe completes (or fails).
 * Paymob appends transaction fields + ?hmac=... to the configured return URL.
 *
 * We trust the server-to-server webhook for the source of truth — this route
 * only routes the customer to the right page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const fields: Record<string, unknown> = {};
  params.forEach((value, key) => {
    fields[key] = value;
  });
  const hmac = String(fields.hmac ?? "");

  const valid = verifyPaymobHmac(fields, hmac);
  const success = valid && fields.success === "true";
  const merchantOrderId = String(
    fields.merchant_order_id ?? fields["order.merchant_order_id"] ?? "",
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("cart_items").delete().eq("user_id", user.id);
      }
    }
  }

  const target = orderId
    ? success
      ? `/checkout/success?order=${orderId}`
      : `/cart?error=card`
    : "/cart";

  return NextResponse.redirect(new URL(target, url.origin));
}
