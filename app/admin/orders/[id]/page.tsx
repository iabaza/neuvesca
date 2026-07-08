import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import OrderStatusForm from "./OrderStatusForm";

function fmtDate(value: string) {
  return new Date(value).toLocaleString("en-EG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, subtotal_cents, shipping_cents, tax_cents, total_cents, discount_cents, currency, customer_name, customer_email, customer_phone, shipping_name, shipping_address_line1, shipping_address_line2, shipping_city, shipping_region, shipping_postal_code, shipping_country, created_at, updated_at, promo_code_id, user_id",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select(
      "id, product_name, product_slug, product_family, quantity, unit_price_cents, total_price_cents",
    )
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  const { data: promo } = order.promo_code_id
    ? await supabase
        .from("promo_codes")
        .select("code, discount_percent")
        .eq("id", order.promo_code_id)
        .maybeSingle()
    : { data: null };

  return (
    <>
      <header className="adminPageHead">
        <div>
          <p className="eyebrow">
            <Link
              href="/admin/orders"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              ← Back to orders
            </Link>
          </p>
          <h1>Order #{order.id.slice(0, 8)}</h1>
          <p>
            Placed {fmtDate(order.created_at)} · last updated{" "}
            {fmtDate(order.updated_at)}
          </p>
        </div>
        <OrderStatusForm orderId={order.id} initialStatus={order.status} />
      </header>

      <section className="adminPanelGrid">
        <div className="adminCard">
          <div className="adminPanelHead">
            <h2>Items</h2>
          </div>
          <table className="adminTable" style={{ borderRadius: 0, border: 0 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: "center" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Unit</th>
                <th style={{ textAlign: "right" }}>Line total</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((it) => (
                <tr key={it.id}>
                  <td>
                    <div style={{ display: "grid", gap: 2, lineHeight: 1.2 }}>
                      <span style={{ fontWeight: 500 }}>{it.product_name}</span>
                      <span style={{ color: "var(--admin-muted)", fontSize: "0.75rem" }}>
                        {it.product_family ?? ""}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>{it.quantity}</td>
                  <td style={{ textAlign: "right" }}>
                    {formatPrice(it.unit_price_cents, order.currency)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    {formatPrice(it.total_price_cents, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl
            style={{
              borderTop: "1px solid var(--admin-line-soft)",
              display: "grid",
              fontSize: "0.92rem",
              gap: "0.5rem",
              marginTop: "1rem",
              paddingTop: "1rem",
            }}
          >
            <Row label="Subtotal" value={formatPrice(order.subtotal_cents, order.currency)} />
            {order.discount_cents > 0 && (
              <Row
                label={
                  promo
                    ? `Discount (${promo.code} · ${promo.discount_percent}%)`
                    : "Discount"
                }
                value={`− ${formatPrice(order.discount_cents, order.currency)}`}
              />
            )}
            <Row label="Shipping" value={formatPrice(order.shipping_cents, order.currency)} />
            {order.tax_cents > 0 && (
              <Row label="Tax" value={formatPrice(order.tax_cents, order.currency)} />
            )}
            <Row
              label="Total"
              value={formatPrice(order.total_cents, order.currency)}
              strong
            />
          </dl>
        </div>

        <div className="adminCard">
          <div className="adminPanelHead">
            <h2>Customer & shipping</h2>
          </div>
          <Field label="Name" value={order.customer_name} />
          <Field label="Email" value={order.customer_email} />
          <Field label="Phone" value={order.customer_phone || "—"} />
          <Field
            label="Type"
            value={order.user_id ? "Registered customer" : "Guest"}
          />
          <Field label="Ship to" value={order.shipping_name} />
          <Field
            label="Address"
            value={[
              order.shipping_address_line1,
              order.shipping_address_line2,
              [order.shipping_city, order.shipping_region]
                .filter(Boolean)
                .join(", "),
              order.shipping_postal_code,
              order.shipping_country,
            ]
              .filter(Boolean)
              .join("\n")}
            multiline
          />
        </div>
      </section>
    </>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
      <dt style={{ color: "var(--admin-muted)" }}>{label}</dt>
      <dd
        style={{
          fontWeight: strong ? 700 : 400,
          fontSize: strong ? "1.05rem" : undefined,
          margin: 0,
        }}
      >
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--admin-line-soft)",
        display: "grid",
        gap: "0.25rem",
        padding: "0.6rem 0",
      }}
    >
      <span
        style={{
          color: "var(--admin-muted)",
          fontSize: "0.66rem",
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ whiteSpace: multiline ? "pre-line" : "normal" }}>
        {value || "—"}
      </span>
    </div>
  );
}
