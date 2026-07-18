import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

const STATUS_BADGE: Record<string, string> = {
  pending: "adminBadgeWarn",
  confirmed: "adminBadgeNeutral",
  processing: "adminBadgeNeutral",
  shipped: "adminBadgeNeutral",
  delivered: "adminBadgeOk",
  cancelled: "adminBadgeAlert",
};

function fmtDate(value: string) {
  return new Date(value).toLocaleString("en-EG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateShort(value: string) {
  return new Date(value).toLocaleDateString("en-EG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminOrdersPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, total_cents, currency, customer_name, customer_email, created_at, discount_cents",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <header className="adminPageHead">
        <div>
          <p className="eyebrow">Orders</p>
          <h1>All orders.</h1>
          <p>Most recent first. Click any row to update fulfilment status.</p>
        </div>
      </header>

      {error ? (
        <div className="adminCard adminToast">{error.message}</div>
      ) : !data || data.length === 0 ? (
        <div className="adminCard adminEmpty">No orders yet.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="adminTableWrap adminHideOnMobile">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Placed</th>
                  <th style={{ textAlign: "right" }}>Discount</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`}>
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: 2, lineHeight: 1.2 }}>
                        <span>{order.customer_name || "—"}</span>
                        <span style={{ color: "var(--admin-muted)", fontSize: "0.75rem" }}>
                          {order.customer_email || ""}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`adminBadge ${STATUS_BADGE[order.status] ?? "adminBadgeNeutral"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="adminMuted">{fmtDate(order.created_at)}</td>
                    <td style={{ textAlign: "right" }} className="adminMuted">
                      {order.discount_cents > 0
                        ? `− ${formatPrice(order.discount_cents, order.currency)}`
                        : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatPrice(order.total_cents, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="adminOrderCardList adminShowOnMobile">
            {data.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="adminOrderCard"
              >
                <div className="adminOrderCardTop">
                  <span className="adminOrderCardId">#{order.id.slice(0, 8)}</span>
                  <span className={`adminBadge ${STATUS_BADGE[order.status] ?? "adminBadgeNeutral"}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="adminOrderCardCustomer">
                  <span>{order.customer_name || "—"}</span>
                  <span className="adminOrderCardEmail">{order.customer_email || ""}</span>
                </div>
                <div className="adminOrderCardBottom">
                  <span className="adminOrderCardDate">{fmtDateShort(order.created_at)}</span>
                  <span className="adminOrderCardTotal">
                    {formatPrice(order.total_cents, order.currency)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
