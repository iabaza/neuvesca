"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServerCart, type ServerCartLine } from "@/lib/queries/cart";
import {
  createPaymobCheckout as createPaymobHostedCheckout,
  paymobConfigured,
} from "@/lib/payments/paymob";

type CheckoutDetails = {
  customer_name: string;
  customer_email: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_city: string;
  shipping_region: string;
  shipping_postal_code: string;
  shipping_country: string;
};

type CheckoutTotals = {
  cart: ServerCartLine[];
  currency: string;
  subtotalCents: number;
  discountCents: number;
  promoCodeId: string | null;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
};

type OrderPaymentMethod =
  | "cash_on_delivery"
  | "stripe"
  | "fawry"
  | "paymob";

export type StripeIntentResult =
  | {
      ok: true;
      clientSecret: string;
      orderId: string;
      publishableKey: string;
    }
  | { ok: false; error: string };

export type PaymobCheckoutResult =
  | {
      ok: true;
      iframeUrl: string;
      orderId: string;
    }
  | { ok: false; error: string };

function getString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function back(error: string) {
  redirect(`/checkout?error=${encodeURIComponent(error)}`);
}

function readCheckoutDetails(
  formData: FormData,
  fallbackEmail: string,
): CheckoutDetails {
  return {
    customer_name: getString(formData, "customer_name"),
    customer_email: getString(formData, "customer_email") || fallbackEmail,
    shipping_address_line1: getString(formData, "shipping_address_line1"),
    shipping_address_line2: getString(formData, "shipping_address_line2"),
    shipping_city: getString(formData, "shipping_city"),
    shipping_region: getString(formData, "shipping_region"),
    shipping_postal_code: getString(formData, "shipping_postal_code"),
    shipping_country: getString(formData, "shipping_country"),
  };
}

function validateCheckoutDetails(details: CheckoutDetails) {
  if (
    !details.customer_name ||
    !details.shipping_address_line1 ||
    !details.shipping_city ||
    !details.shipping_postal_code ||
    !details.shipping_country
  ) {
    return "Please complete every required shipping field.";
  }

  return null;
}

async function resolvePromo(
  supabase: ReturnType<typeof createClient>,
  rawCode: string,
): Promise<{ id: string; percent: number } | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  const { data } = await supabase
    .from("promo_codes")
    .select("id, discount_percent, starts_at, ends_at, max_uses, used_count, is_active")
    .ilike("code", code)
    .maybeSingle();
  if (!data || !data.is_active) return null;
  const now = Date.now();
  if (data.starts_at && new Date(data.starts_at).getTime() > now) return null;
  if (data.ends_at && new Date(data.ends_at).getTime() < now) return null;
  if (data.max_uses != null && data.used_count >= data.max_uses) return null;
  return { id: data.id, percent: data.discount_percent };
}

async function getCheckoutTotals(
  userId: string,
  promoCode: string | null,
): Promise<CheckoutTotals> {
  const supabase = createClient();
  const cart = await getServerCart(userId);
  if (cart.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const currency = cart[0].currency;
  const subtotalCents = cart.reduce(
    (n, l) => n + l.quantity * l.unitPriceCents,
    0,
  );

  let discountCents = 0;
  let promoCodeId: string | null = null;
  if (promoCode) {
    const promo = await resolvePromo(supabase, promoCode);
    if (promo) {
      discountCents = Math.round((subtotalCents * promo.percent) / 100);
      promoCodeId = promo.id;
    }
  }

  const shippingCents = 0;
  const taxCents = 0;
  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents + taxCents;

  return {
    cart,
    currency,
    subtotalCents,
    discountCents,
    promoCodeId,
    shippingCents,
    taxCents,
    totalCents,
  };
}

async function insertOrderWithItems({
  supabase,
  userId,
  details,
  totals,
  paymentMethod,
  orderId,
  stripePaymentIntentId,
  paymobMerchantOrderId,
  paymobOrderId,
}: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  details: CheckoutDetails;
  totals: CheckoutTotals;
  paymentMethod: OrderPaymentMethod;
  orderId?: string;
  stripePaymentIntentId?: string;
  paymobMerchantOrderId?: string;
  paymobOrderId?: number;
}) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      ...(orderId ? { id: orderId } : {}),
      user_id: userId,
      status: "pending",
      payment_method: paymentMethod,
      ...(stripePaymentIntentId
        ? { stripe_payment_intent_id: stripePaymentIntentId }
        : {}),
      ...(paymobMerchantOrderId
        ? { paymob_merchant_order_id: paymobMerchantOrderId }
        : {}),
      ...(paymobOrderId ? { paymob_order_id: paymobOrderId } : {}),
      subtotal_cents: totals.subtotalCents,
      discount_cents: totals.discountCents,
      promo_code_id: totals.promoCodeId,
      shipping_cents: totals.shippingCents,
      tax_cents: totals.taxCents,
      total_cents: totals.totalCents,
      currency: totals.currency,
      customer_email: details.customer_email,
      customer_name: details.customer_name,
      shipping_name: details.customer_name,
      shipping_address_line1: details.shipping_address_line1,
      shipping_address_line2: details.shipping_address_line2 || null,
      shipping_city: details.shipping_city,
      shipping_region: details.shipping_region || null,
      shipping_postal_code: details.shipping_postal_code,
      shipping_country: details.shipping_country,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message || "We couldn't place your order.");
  }

  const items = totals.cart.map((l) => ({
    order_id: order!.id,
    product_id: l.productId,
    product_slug: l.productSlug,
    product_name: l.productName,
    product_family: l.productFamily,
    quantity: l.quantity,
    unit_price_cents: l.unitPriceCents,
    total_price_cents: l.quantity * l.unitPriceCents,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items);

  if (itemsError) {
    throw new Error(itemsError.message || "We couldn't save your order items.");
  }

  return order.id;
}

function compactCartMetadata(cart: ServerCartLine[]) {
  return cart
    .map((line) => `${line.productSlug}:${line.scentSlug ?? "-"}:${line.quantity}`)
    .join("|")
    .slice(0, 450);
}

async function createStripeIntent({
  secretKey,
  orderId,
  userId,
  details,
  totals,
}: {
  secretKey: string;
  orderId: string;
  userId: string;
  details: CheckoutDetails;
  totals: CheckoutTotals;
}) {
  const body = new URLSearchParams();
  body.set("amount", String(totals.totalCents));
  body.set("currency", totals.currency.toLowerCase());
  body.set("automatic_payment_methods[enabled]", "true");
  body.set("receipt_email", details.customer_email);
  body.set("metadata[user_id]", userId);
  body.set("metadata[order_id]", orderId);
  body.set("metadata[cart]", compactCartMetadata(totals.cart));

  const countryCode = details.shipping_country.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(countryCode)) {
    body.set("shipping[name]", details.customer_name);
    body.set("shipping[address][line1]", details.shipping_address_line1);
    if (details.shipping_address_line2) {
      body.set("shipping[address][line2]", details.shipping_address_line2);
    }
    body.set("shipping[address][city]", details.shipping_city);
    if (details.shipping_region) {
      body.set("shipping[address][state]", details.shipping_region);
    }
    body.set("shipping[address][postal_code]", details.shipping_postal_code);
    body.set("shipping[address][country]", countryCode);
  }

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `order-${orderId}`,
    },
    body,
  });

  const payload = (await response.json()) as {
    id?: string;
    client_secret?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.id || !payload.client_secret) {
    throw new Error(
      payload.error?.message || "Stripe could not create the payment.",
    );
  }

  return {
    id: payload.id,
    clientSecret: payload.client_secret,
  };
}

async function cancelStripeIntent(secretKey: string, paymentIntentId: string) {
  await fetch(
    `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  ).catch(() => undefined);
}

export async function placeOrder(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/checkout");

  const details = readCheckoutDetails(formData, user.email || "");
  const validationError = validateCheckoutDetails(details);
  if (validationError) back(validationError);

  const promoCode = getString(formData, "promo_code");
  let orderId = "";
  try {
    const totals = await getCheckoutTotals(user.id, promoCode || null);
    orderId = await insertOrderWithItems({
      supabase,
      userId: user.id,
      details,
      totals,
      paymentMethod: "cash_on_delivery",
    });
    if (totals.promoCodeId) {
      try {
        await supabase.rpc("increment_promo_use", {
          promo_id: totals.promoCodeId,
        });
      } catch {
        /* best-effort — order already saved */
      }
    }
  } catch {
    back("We couldn't place your order. Please try again.");
  }

  // Empty the cart now that the order is recorded.
  await supabase.from("cart_items").delete().eq("user_id", user.id);

  redirect(`/checkout/success?order=${orderId}`);
}

export async function createStripePaymentIntent(
  formData: FormData,
): Promise<StripeIntentResult> {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!publishableKey || !secretKey) {
    return {
      ok: false,
      error:
        "Stripe is not configured yet. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in before paying with Stripe." };
  }

  const details = readCheckoutDetails(formData, user.email || "");
  const validationError = validateCheckoutDetails(details);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const orderId = crypto.randomUUID();
  let paymentIntentId = "";
  const promoCode = getString(formData, "promo_code");

  try {
    const totals = await getCheckoutTotals(user.id, promoCode || null);
    const paymentIntent = await createStripeIntent({
      secretKey,
      orderId,
      userId: user.id,
      details,
      totals,
    });
    paymentIntentId = paymentIntent.id;

    await insertOrderWithItems({
      supabase,
      userId: user.id,
      details,
      totals,
      paymentMethod: "stripe",
      orderId,
      stripePaymentIntentId: paymentIntent.id,
    });

    return {
      ok: true,
      clientSecret: paymentIntent.clientSecret,
      orderId,
      publishableKey,
    };
  } catch (error) {
    if (paymentIntentId) {
      await cancelStripeIntent(secretKey, paymentIntentId);
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Stripe checkout could not start.",
    };
  }
}

export async function createPaymobCheckout(
  formData: FormData,
): Promise<PaymobCheckoutResult> {
  if (!paymobConfigured()) {
    return {
      ok: false,
      error:
        "Card payment is not configured yet. Set PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_IFRAME_ID and PAYMOB_HMAC_SECRET.",
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sign in before paying by card." };
  }

  const details = readCheckoutDetails(formData, user.email || "");
  const validationError = validateCheckoutDetails(details);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const customerMobile = getString(formData, "customer_mobile");
  if (!customerMobile) {
    return {
      ok: false,
      error: "Add a mobile number — it's required for card payment.",
    };
  }

  const promoCode = getString(formData, "promo_code");

  try {
    const totals = await getCheckoutTotals(user.id, promoCode || null);

    const orderId = crypto.randomUUID();
    const merchantOrderId = orderId.replace(/-/g, "").slice(0, 32);

    const [firstName, ...rest] = details.customer_name.trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName || "Customer";
    const country = (details.shipping_country || "EG").slice(0, 2).toUpperCase();

    const checkout = await createPaymobHostedCheckout({
      amountCents: totals.totalCents,
      merchantOrderId,
      items: [
        {
          name: `Neuvesca order ${merchantOrderId}`,
          amount_cents: totals.totalCents,
          quantity: 1,
        },
      ],
      billing: {
        first_name: firstName || "Customer",
        last_name: lastName,
        email: details.customer_email,
        phone_number: customerMobile,
        street: details.shipping_address_line1,
        apartment: details.shipping_address_line2 || "NA",
        building: "NA",
        floor: "NA",
        city: details.shipping_city,
        state: details.shipping_region || "NA",
        postal_code: details.shipping_postal_code,
        country,
      },
    });

    await insertOrderWithItems({
      supabase,
      userId: user.id,
      details,
      totals,
      paymentMethod: "paymob",
      orderId,
      paymobMerchantOrderId: merchantOrderId,
      paymobOrderId: checkout.paymobOrderId,
    });

    return {
      ok: true,
      iframeUrl: checkout.iframeUrl,
      orderId,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Card checkout could not start.",
    };
  }
}
