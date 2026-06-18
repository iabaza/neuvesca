import crypto from "crypto";

/**
 * Helpers for Paymob (Accept) hosted iframe checkout.
 *
 * Required env vars:
 *   PAYMOB_API_KEY           – from Paymob dashboard → API Keys
 *   PAYMOB_INTEGRATION_ID    – card-payment integration id (numeric)
 *   PAYMOB_IFRAME_ID         – the iframe id (numeric) used to render checkout
 *   PAYMOB_HMAC_SECRET       – HMAC secret for verifying webhook + callback
 *   NEXT_PUBLIC_SITE_URL     – your site URL (used for redirect URLs)
 */

const PAYMOB_BASE = "https://accept.paymob.com/api";

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
  amount_cents: number;
  description?: string;
  quantity: number;
};

function getEnv() {
  return {
    apiKey: process.env.PAYMOB_API_KEY ?? "",
    integrationId: process.env.PAYMOB_INTEGRATION_ID ?? "",
    iframeId: process.env.PAYMOB_IFRAME_ID ?? "",
    hmacSecret: process.env.PAYMOB_HMAC_SECRET ?? "",
  };
}

export function paymobConfigured() {
  const { apiKey, integrationId, iframeId, hmacSecret } = getEnv();
  return Boolean(apiKey && integrationId && iframeId && hmacSecret);
}

async function authenticate() {
  const { apiKey } = getEnv();
  const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Paymob authentication failed.");
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("Paymob returned no auth token.");
  return data.token;
}

async function createOrder(
  authToken: string,
  amountCents: number,
  merchantOrderId: string,
  items: PaymobItem[],
) {
  const res = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      merchant_order_id: merchantOrderId,
      items,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paymob order failed: ${text}`);
  }
  const data = (await res.json()) as { id?: number };
  if (!data.id) throw new Error("Paymob returned no order id.");
  return data.id;
}

async function requestPaymentKey(
  authToken: string,
  orderId: number,
  amountCents: number,
  billing: PaymobBilling,
) {
  const { integrationId } = getEnv();
  const res = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: billing,
      currency: "EGP",
      integration_id: Number(integrationId),
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paymob payment key failed: ${text}`);
  }
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("Paymob returned no payment key.");
  return data.token;
}

export type PaymobCheckout = {
  iframeUrl: string;
  paymobOrderId: number;
};

export async function createPaymobCheckout(args: {
  amountCents: number;
  merchantOrderId: string;
  billing: PaymobBilling;
  items: PaymobItem[];
}): Promise<PaymobCheckout> {
  const { iframeId } = getEnv();
  const authToken = await authenticate();
  const paymobOrderId = await createOrder(
    authToken,
    args.amountCents,
    args.merchantOrderId,
    args.items,
  );
  const paymentKey = await requestPaymentKey(
    authToken,
    paymobOrderId,
    args.amountCents,
    args.billing,
  );
  const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;
  return { iframeUrl, paymobOrderId };
}

/**
 * Verify Paymob's HMAC for callback (query string) or webhook (JSON body).
 *
 * Paymob concatenates these fields in this exact order then HMAC-SHA512
 * with the secret. Reference:
 *   https://developers.paymob.com/egypt/checkout-api/payment-integration/credit-card-integration#hmac-calculation
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
