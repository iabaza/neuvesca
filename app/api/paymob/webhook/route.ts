import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOrderPlaced } from "@/lib/orders/notify";
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

  // Must be one of orders_status_valid:
  // pending | confirmed | processing | shipped | delivered | cancelled.
  // A successful payment maps to "confirmed" — the state the admin dashboard
  // treats as "paid, ready to fulfil". Refunds and voids both map to
  // "cancelled" since the schema has no dedicated refunded state.
  const paymentSucceeded = Boolean(obj.success) && !obj.is_refunded && !obj.is_voided;
  const next = obj.is_refunded || obj.is_voided
    ? "cancelled"
    : obj.success
      ? "confirmed"
      : "pending";

  const supabase = createAdminClient();
  const { data: updated, error } = await supabase
    .from("orders")
    .update({
      status: next,
      paymob_order_id: obj.order?.id ?? null,
    })
    .eq("paymob_merchant_order_id", merchantOrderId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[paymob/webhook] order update failed:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Only now — once the payment is actually confirmed — does the customer get
  // their receipt. notifyOrderPlaced is idempotent, so Paymob re-delivering
  // this webhook cannot send a second copy.
  if (updated?.id && paymentSucceeded) {
    await notifyOrderPlaced(updated.id);
  }

  return NextResponse.json({ ok: true });
}
