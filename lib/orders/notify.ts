import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewOrderNotification } from "@/lib/email";

/**
 * Sends the "order placed" admin alert + customer receipt for an order.
 *
 * Safe to call more than once: the notification is claimed with a single
 * conditional UPDATE on `notified_at`, so concurrent or retried callers (Paymob
 * re-delivers webhooks) can never send a duplicate receipt. Only the caller
 * that wins the update proceeds.
 *
 * Never throws — a failed notification must not fail a paid order.
 */
export async function notifyOrderPlaced(orderId: string): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { data: order } = await supabase
      .from("orders")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", orderId)
      .is("notified_at", null)
      .select(
        "id, customer_name, customer_email, total_cents, subtotal_cents, discount_cents, shipping_cents, currency, payment_method, shipping_address_line1, shipping_address_line2, shipping_city, shipping_region, shipping_postal_code, shipping_country",
      )
      .maybeSingle();

    // No row means another caller already claimed and sent this notification.
    if (!order) return;

    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, quantity, unit_price_cents")
      .eq("order_id", orderId);

    const shippingAddress = [
      order.shipping_address_line1,
      order.shipping_address_line2,
      order.shipping_city,
      order.shipping_region,
      order.shipping_postal_code,
      order.shipping_country,
    ]
      .filter(Boolean)
      .join(", ");

    await sendNewOrderNotification({
      orderId: order.id,
      customerName: order.customer_name ?? "",
      customerEmail: order.customer_email ?? "",
      totalCents: order.total_cents,
      subtotalCents: order.subtotal_cents,
      discountCents: order.discount_cents ?? 0,
      shippingCents: order.shipping_cents ?? 0,
      currency: order.currency,
      items: (items ?? []).map((i) => ({
        productName: i.product_name,
        quantity: i.quantity,
        unitPriceCents: i.unit_price_cents,
      })),
      shippingAddress,
      paymentMethod: order.payment_method,
    });
  } catch (err) {
    console.error(
      `[notifyOrderPlaced] failed for order ${orderId}:`,
      err instanceof Error ? err.message : err,
    );
  }
}
