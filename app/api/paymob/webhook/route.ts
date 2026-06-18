import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  flattenWebhookTransaction,
  verifyPaymobHmac,
} from "@/lib/payments/paymob";

/**
 * Paymob server-to-server notification.
 * Configure the URL in your Paymob dashboard:
 *   https://<your-domain>/api/paymob/webhook
 *
 * The HMAC is in the ?hmac=... query string. The body is JSON with shape:
 *   { type: "TRANSACTION", obj: { ... transaction fields ... } }
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const hmac = url.searchParams.get("hmac") ?? "";

  let payload: { type?: string; obj?: Record<string, unknown> };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const fields = flattenWebhookTransaction(payload);
  if (!verifyPaymobHmac(fields, hmac)) {
    return NextResponse.json(
      { ok: false, error: "invalid_hmac" },
      { status: 401 },
    );
  }

  const obj = (payload.obj ?? {}) as {
    success?: boolean;
    is_refunded?: boolean;
    is_voided?: boolean;
    order?: { merchant_order_id?: string; id?: number };
  };

  const merchantOrderId = obj.order?.merchant_order_id ?? "";
  if (!merchantOrderId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const next = obj.is_refunded
    ? "refunded"
    : obj.is_voided
      ? "cancelled"
      : obj.success
        ? "paid"
        : "pending";

  const supabase = createClient();
  await supabase
    .from("orders")
    .update({
      status: next,
      paymob_order_id: obj.order?.id ?? null,
    })
    .eq("paymob_merchant_order_id", merchantOrderId);

  return NextResponse.json({ ok: true });
}
