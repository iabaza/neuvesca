import crypto from "crypto";

/**
 * Paymob Unified Checkout (the "Flash" / Intention API).
 *
 * Replaces the old three-call dance (auth token -> ecommerce order -> payment
 * key -> iframe) with a single POST that returns a client secret, which is
 * then handed to Paymob's hosted checkout page.
 *
 * Required env vars:
 *   PAYMOB_SECRET_KEY      – Settings -> API Keys  (egy_sk_...)
 *   PAYMOB_PUBLIC_KEY      – Settings -> API Keys  (egy_pk_...)
 *   PAYMOB_INTEGRATION_ID  – Developers -> Payment Integrations (numeric)
 *   PAYMOB_HMAC_SECRET     – for verifying webhook + callback signatures
 *   NEXT_PUBLIC_SITE_URL   – used to build the return/notification URLs
 */

const INTENTION_URL = "https://accept.paymob.com/v1/intention/";
const UNIFIED_CHECKOUT_URL = "https://accept.paymob.com/unifiedcheckout/";

export type PaymobBilling = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  apartment?: string;
  street: string;
  building?: string;
  floor?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string; // ISO 3166-1 alpha-2 (e.g., "EG")
};

export type PaymobItem = {
  name: string;
  /** UNIT price in cents. Paymob multiplies this by `quantity`. */
  amount_cents: number;
  quantity: number;
  description?: string;
};

function getEnv() {
  return {
    secretKey: process.env.PAYMOB_SECRET_KEY ?? "",
    publicKey: process.env.PAYMOB_PUBLIC_KEY ?? "",
    integrationId: process.env.PAYMOB_INTEGRATION_ID ?? "",
    hmacSecret: process.env.PAYMOB_HMAC_SECRET ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.neuvesca.com",
  };
}

export function paymobConfigured() {
  const { secretKey, publicKey, integrationId, hmacSecret } = getEnv();
  return Boolean(secretKey && publicKey && integrationId && hmacSecret);
}

export type PaymobCheckout = {
  checkoutUrl: string;
  paymobOrderId: number;
  clientSecret: string;
};

type IntentionResponse = {
  client_secret?: string;
  intention_order_id?: number;
  id?: string;
  detail?: string;
};

/**
 * Creates a payment intention and returns the hosted checkout URL.
 *
 * Paymob validates that `amount` equals the sum of `item.amount * quantity`
 * and rejects the whole request with 406 `unmatched_item_prices` otherwise.
 * Since our total also carries shipping and promo discounts, the caller passes
 * those as explicit line items. If the arithmetic still does not line up we
 * fall back to a single summary line rather than failing the customer's
 * checkout over a presentational detail.
 */
export async function createPaymobCheckout(args: {
  amountCents: number;
  merchantOrderId: string;
  billing: PaymobBilling;
  items: PaymobItem[];
}): Promise<PaymobCheckout> {
  const { secretKey, publicKey, integrationId, siteUrl } = getEnv();

  const itemsTotal = args.items.reduce(
    (sum, i) => sum + i.amount_cents * i.quantity,
    0,
  );
  const items =
    itemsTotal === args.amountCents && args.items.length > 0
      ? args.items
      : [
          {
            name: `Neuvesca order ${args.merchantOrderId}`,
            amount_cents: args.amountCents,
            quantity: 1,
          },
        ];

  if (itemsTotal !== args.amountCents && args.items.length > 0) {
    console.warn(
      `[paymob] item total ${itemsTotal} != order total ${args.amountCents}; sent a single summary line instead.`,
    );
  }

  const res = await fetch(INTENTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: args.amountCents,
      currency: "EGP",
      payment_methods: [Number(integrationId)],
      items: items.map((i) => ({
        name: i.name,
        amount: i.amount_cents,
        quantity: i.quantity,
        ...(i.description ? { description: i.description } : {}),
      })),
      billing_data: {
        first_name: args.billing.first_name,
        last_name: args.billing.last_name,
        email: args.billing.email,
        phone_number: args.billing.phone_number,
        street: args.billing.street,
        apartment: args.billing.apartment || "NA",
        building: args.billing.building || "NA",
        floor: args.billing.floor || "NA",
        city: args.billing.city,
        state: args.billing.state || "NA",
        postal_code: args.billing.postal_code || "NA",
        country: args.billing.country,
      },
      // Echoed back on the webhook, and how we map a payment to our order.
      special_reference: args.merchantOrderId,
      redirection_url: `${siteUrl}/api/paymob/callback`,
      notification_url: `${siteUrl}/api/paymob/webhook`,
    }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as IntentionResponse;

  if (!res.ok) {
    throw new Error(
      `Paymob intention failed (${res.status}): ${data.detail ?? JSON.stringify(data)}`,
    );
  }
  if (!data.client_secret) {
    throw new Error("Paymob returned no client secret.");
  }

  const checkoutUrl = `${UNIFIED_CHECKOUT_URL}?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(data.client_secret)}`;

  return {
    checkoutUrl,
    paymobOrderId: data.intention_order_id ?? 0,
    clientSecret: data.client_secret,
  };
}

/**
 * Verify Paymob's HMAC for callback (query string) or webhook (JSON body).
 *
 * Paymob concatenates these fields in this exact order then HMAC-SHA512
 * with the secret. Unchanged by the Unified Checkout migration — the
 * transaction webhook payload is the same shape as before.
 *
 *   amount_cents, created_at, currency, error_occured, has_parent_transaction,
 *   id, integration_id, is_3d_secure, is_auth, is_capture, is_refunded,
 *   is_standalone_payment, is_voided, order_id, owner, pending,
 *   source_data_pan, source_data_sub_type, source_data_type, success
 */
export function verifyPaymobHmac(
  fields: Record<string, unknown>,
  receivedHmac: string,
): boolean {
  const { hmacSecret } = getEnv();
  if (!hmacSecret || !receivedHmac) return false;

  const order = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order_id",
    "owner",
    "pending",
    "source_data_pan",
    "source_data_sub_type",
    "source_data_type",
    "success",
  ];

  const concatenated = order.map((k) => String(fields[k] ?? "")).join("");
  const expected = crypto
    .createHmac("sha512", hmacSecret)
    .update(concatenated)
    .digest("hex");

  return expected.toLowerCase() === receivedHmac.toLowerCase();
}

/**
 * Flatten Paymob's webhook JSON body (which is nested) into the flat field
 * names used for HMAC calculation.
 */
export function flattenWebhookTransaction(payload: {
  obj?: Record<string, unknown>;
}): Record<string, unknown> {
  const t = (payload?.obj ?? {}) as Record<string, unknown>;
  const order = (t.order ?? {}) as Record<string, unknown>;
  const source = (t.source_data ?? {}) as Record<string, unknown>;

  return {
    amount_cents: t.amount_cents,
    created_at: t.created_at,
    currency: t.currency,
    error_occured: t.error_occured,
    has_parent_transaction: t.has_parent_transaction,
    id: t.id,
    integration_id: t.integration_id,
    is_3d_secure: t.is_3d_secure,
    is_auth: t.is_auth,
    is_capture: t.is_capture,
    is_refunded: t.is_refunded,
    is_standalone_payment: t.is_standalone_payment,
    is_voided: t.is_voided,
    order_id: order.id,
    owner: t.owner,
    pending: t.pending,
    source_data_pan: source.pan,
    source_data_sub_type: source.sub_type,
    source_data_type: source.type,
    success: t.success,
  };
}

/**
 * Normalize the raw query string Paymob appends to redirection_url into the
 * flat field names verifyPaymobHmac expects.
 *
 * The browser redirect uses different literal key names than the webhook JSON
 * body: the order reference arrives as `order` (not `order_id`), and nested
 * fields use dot notation — `source_data.pan`, `source_data.type`,
 * `source_data.sub_type` — rather than underscores. Passing the raw query
 * straight into verifyPaymobHmac silently looks up the wrong keys, computes
 * the wrong HMAC, and rejects every successful payment as invalid — this was
 * confirmed against a real Paymob-signed redirect: the un-normalized fields
 * produce an HMAC that does not match Paymob's, and once normalized here it
 * matches exactly.
 */
export function normalizePaymobCallbackQuery(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...fields,
    order_id: fields.order_id ?? fields.order ?? fields["order.id"],
    source_data_pan: fields.source_data_pan ?? fields["source_data.pan"],
    source_data_sub_type:
      fields.source_data_sub_type ?? fields["source_data.sub_type"],
    source_data_type: fields.source_data_type ?? fields["source_data.type"],
  };
}
