import crypto from "crypto";

/**
 * Helpers for FawryPay hosted checkout.
 *
 * Required env vars:
 *   FAWRY_MERCHANT_CODE   – your merchant code from the Fawry dashboard
 *   FAWRY_SECURITY_KEY    – your secure hash key
 *   FAWRY_ENVIRONMENT     – "production" or "staging" (defaults to staging)
 *   FAWRY_RETURN_URL      – optional absolute URL Fawry redirects to after pay
 *                           (defaults to <SITE_URL>/api/fawry/callback)
 *   NEXT_PUBLIC_SITE_URL  – your site URL, e.g. https://neuvesca.com
 */

export type FawryChargeItem = {
  itemId: string;
  description: string;
  price: number; // in EGP (decimal)
  quantity: number;
};

export type FawryChargeRequest = {
  merchantRefNumber: string;
  customerProfileId?: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  chargeItems: FawryChargeItem[];
  returnUrl: string;
  language?: "en-gb" | "ar-eg";
};

function getEnv() {
  const merchantCode = process.env.FAWRY_MERCHANT_CODE ?? "";
  const securityKey = process.env.FAWRY_SECURITY_KEY ?? "";
  const env = (process.env.FAWRY_ENVIRONMENT ?? "staging").toLowerCase();
  const baseUrl =
    env === "production"
      ? "https://www.atfawry.com"
      : "https://atfawry.fawrystaging.com";
  return { merchantCode, securityKey, baseUrl };
}

export function fawryConfigured() {
  const { merchantCode, securityKey } = getEnv();
  return Boolean(merchantCode && securityKey);
}

/**
 * Build the SHA-256 signature for the hosted checkout.
 *
 * Hash input:
 *   merchantCode
 * + merchantRefNumber
 * + customerProfileId (empty string if not provided)
 * + returnUrl
 * + for each item (sorted asc by itemId): itemId + quantity + price-fixed-2
 * + securityKey
 */
export function buildHostedSignature(req: FawryChargeRequest) {
  const { merchantCode, securityKey } = getEnv();
  const items = [...req.chargeItems].sort((a, b) =>
    a.itemId.localeCompare(b.itemId),
  );
  const itemsPart = items
    .map((i) => `${i.itemId}${i.quantity}${i.price.toFixed(2)}`)
    .join("");
  const raw =
    merchantCode +
    req.merchantRefNumber +
    (req.customerProfileId ?? "") +
    req.returnUrl +
    itemsPart +
    securityKey;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Return the form fields you need to POST to the Fawry hosted checkout URL.
 * The frontend (or a small redirector route) will submit this as a form.
 */
export function buildHostedCheckout(req: FawryChargeRequest) {
  const { merchantCode, baseUrl } = getEnv();
  const action = `${baseUrl}/atfawry/plugin/payment`;
  const signature = buildHostedSignature(req);

  const fields: Record<string, string> = {
    merchantCode,
    merchantRefNumber: req.merchantRefNumber,
    customerName: req.customerName,
    customerMobile: req.customerMobile,
    customerEmail: req.customerEmail,
    language: req.language ?? "en-gb",
    returnUrl: req.returnUrl,
    signature,
  };

  if (req.customerProfileId) {
    fields.customerProfileId = req.customerProfileId;
  }

  req.chargeItems.forEach((item, idx) => {
    fields[`chargeItems[${idx}].itemId`] = item.itemId;
    fields[`chargeItems[${idx}].description`] = item.description;
    fields[`chargeItems[${idx}].price`] = item.price.toFixed(2);
    fields[`chargeItems[${idx}].quantity`] = String(item.quantity);
  });

  return { action, fields };
}

/**
 * Validate a webhook notification's `messageSignature`.
 * Fawry's docs: messageSignature = SHA-256(
 *   fawryRefNumber + merchantRefNumber + paymentAmount(2dp) +
 *   orderAmount(2dp) + orderStatus + paymentMethod + securityKey
 * )
 */
export function verifyWebhookSignature(payload: {
  fawryRefNumber?: string | number;
  merchantRefNumber?: string;
  paymentAmount?: number | string;
  orderAmount?: number | string;
  orderStatus?: string;
  paymentMethod?: string;
  messageSignature?: string;
}) {
  const { securityKey } = getEnv();
  const fmt = (v: unknown) => Number(v ?? 0).toFixed(2);
  const raw =
    `${payload.fawryRefNumber ?? ""}` +
    `${payload.merchantRefNumber ?? ""}` +
    `${fmt(payload.paymentAmount)}` +
    `${fmt(payload.orderAmount)}` +
    `${payload.orderStatus ?? ""}` +
    `${payload.paymentMethod ?? ""}` +
    securityKey;
  const expected = crypto.createHash("sha256").update(raw).digest("hex");
  return expected === (payload.messageSignature ?? "").toLowerCase();
}
