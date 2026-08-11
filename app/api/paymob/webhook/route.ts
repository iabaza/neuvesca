import { NextResponse } from "next/server";
import { runAfterResponse } from "@/lib/background";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOrderPlaced } from "@/lib/orders/notify";
import {
  flattenWebhookTransaction,
  verifyPaymobHmac,
} from "@/lib/payments/paymob";

/**
 * Paymob server-to-server notification.
 * Configure the URL in the Paymob dashboard (Developers -> Webhooks):
 *   https://<your-domain>/api/paymob/webhook
 *
 * The HMAC is in the ?hmac=... query string. The body is JSON with shape:
 *   { type: "TRANSACTION", obj: { ... transaction fields ... } }
 *
 * IMPORTANT: Paymob aborts the callback if we do not respond within 5 seconds,
 * and reports the integration as failing. Everything slow — the database write,
 * the receipt email over SMTP, the WhatsApp call — therefore runs inside
 * waitUntil(), which lets us return 200 immediately while Vercel keeps the
 * function alive until that work finishes. Only HMAC verification, which is
 * pure local crypto, happens before the response.
 */
// The response returns in milliseconds, but the deferred work (order update,
// receipt email over SMTP, WhatsApp) keeps the function alive. Give it enough
// headroom that a slow mail server cannot cut a receipt short.
export const maxDuration = 30;

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
    order?: {
      merchant_order_id?: string;
      id?: number;
      // Unified Checkout echoes the reference we sent when creating the
      // intention. Paymob surfaces it as merchant_order_id on the order, but
      // both spellings are accepted here so a payload change cannot silently
      // orphan a paid order.
      special_reference?: string;
    };
    special_reference?: string;
  };

  const merchantOrderId =
    obj.order?.merchant_order_id ||
    obj.order?.special_reference ||
    obj.special_reference ||
    "";
  const paymobOrderId = obj.order?.id ?? null;

  if (!merchantOrderId && !paymobOrderId) {
    console.error(
      "[paymob/webhook] no reference on payload:",
      JSON.stringify(obj.order ?? {}),
    );
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Must be one of orders_status_valid:
  // pending | confirmed | processing | shipped | delivered | cancelled.
  // A successful payment maps to "confirmed" — the state the admin dashboard
  // treats as "paid, ready to fulfil". Refunds and voids both map to
  // "cancelled" since the schema has no dedicated refunded state.
  const paymentSucceeded =
    Boolean(obj.success) && !obj.is_refunded && !obj.is_voided;
  const next =
    obj.is_refunded || obj.is_voided
      ? "cancelled"
      : obj.success
        ? "confirmed"
        : "pending";

  runAfterResponse(
    settleOrder({ merchantOrderId, paymobOrderId, next, paymentSucceeded }),
  );

  return NextResponse.json({ ok: true });
}

async function settleOrder(args: {
  merchantOrderId: string;
  paymobOrderId: number | null;
  next: string;
  paymentSucceeded: boolean;
}) {
  try {
    // Prefer our own reference; fall back to Paymob's numeric order id, which
    // we stored when the intention was created.
    const supabase = createAdminClient();
    const update = supabase
      .from("orders")
      .update({ status: args.next, paymob_order_id: args.paymobOrderId });

    const { data: updated, error } = await (args.merchantOrderId
      ? update.eq("paymob_merchant_order_id", args.merchantOrderId)
      : update.eq("paymob_order_id", args.paymobOrderId)
    )
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[paymob/webhook] order update failed:", error.message);
      return;
    }

    if (!updated) {
      console.error(
        `[paymob/webhook] no order matched ref=${args.merchantOrderId} paymobOrderId=${args.paymobOrderId}`,
      );
      return;
    }

    // Only once the payment is actually confirmed does the customer get their
    // receipt. notifyOrderPlaced is idempotent, so Paymob re-delivering this
    // webhook cannot send a second copy.
    if (args.paymentSucceeded) {
      await notifyOrderPlaced(updated.id);
    }
  } catch (err) {
    console.error(
      "[paymob/webhook] settle failed:",
      err instanceof Error ? err.message : err,
    );
  }
}
