import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/payments/fawry";

/**
 * Fawry server-to-server notification. Configure the URL in your Fawry
 * dashboard:  https://<your-domain>/api/fawry/webhook
 *
 * Reference: https://developer.fawrystaging.com/docs/server-apis/server-notification-v2
 */
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const body = payload as {
    merchantRefNumber?: string;
    fawryRefNumber?: string | number;
    orderStatus?: string;
    paymentMethod?: string;
    paymentAmount?: number | string;
    orderAmount?: number | string;
    messageSignature?: string;
  };

  if (!verifyWebhookSignature(body)) {
    return NextResponse.json(
      { ok: false, error: "invalid_signature" },
      { status: 401 },
    );
  }

  if (!body.merchantRefNumber) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = createClient();
  const status = (body.orderStatus ?? "").toUpperCase();

  // Map Fawry's lifecycle to our internal order statuses.
  // PAID = customer paid; NEW = order created; UNPAID = waiting at Fawry;
  // CANCELED / EXPIRED / REFUNDED = terminal failures.
  const next =
    status === "PAID"
      ? "paid"
      : status === "REFUNDED"
        ? "refunded"
        : status === "CANCELED" || status === "EXPIRED" || status === "FAILED"
          ? "cancelled"
          : "pending";

  await supabase
    .from("orders")
    .update({
      status: next,
      fawry_reference_number: String(body.fawryRefNumber ?? "") || null,
    })
    .eq("fawry_merchant_ref_number", body.merchantRefNumber);

  return NextResponse.json({ ok: true });
}
