import nodemailer from "nodemailer";
import { formatPrice } from "@/lib/format";

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

type OrderEmailArgs = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  currency: string;
  items: Array<{ productName: string; quantity: number; unitPriceCents: number }>;
  shippingAddress: string;
  paymentMethod: string;
};

function buildReceiptHtml(args: OrderEmailArgs): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.neuvesca.com";
  const shortId = args.orderId.slice(0, 8).toUpperCase();
  const paymentLabel = args.paymentMethod.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const itemRows = args.items
    .map(
      (i) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #ede8df;font-size:14px;color:#1f1a14;">
            ${i.productName}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #ede8df;font-size:14px;color:#8a7e6f;text-align:center;">
            ${i.quantity}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #ede8df;font-size:14px;color:#1f1a14;text-align:right;">
            ${formatPrice(i.unitPriceCents * i.quantity, args.currency)}
          </td>
        </tr>`,
    )
    .join("");

  const discountRow = args.discountCents > 0
    ? `<tr>
        <td colspan="2" style="padding:6px 0;font-size:13px;color:#8a7e6f;">Discount</td>
        <td style="padding:6px 0;font-size:13px;color:#8a7e6f;text-align:right;">− ${formatPrice(args.discountCents, args.currency)}</td>
       </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f3ec;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ec;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <a href="${siteUrl}" style="font-family:Georgia,serif;font-size:22px;letter-spacing:0.32em;color:#1f1a14;text-decoration:none;">NEUVESCA</a>
          <p style="margin:6px 0 0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8a7e6f;font-family:Arial,sans-serif;">Order Confirmation</p>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;padding:36px 32px;">

          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8a7e6f;">Thank you, ${args.customerName}</p>
          <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:#1f1a14;line-height:1.2;">Your order is confirmed.</h1>

          <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:14px;color:#4b4339;line-height:1.7;">
            We've received your order and will begin preparing it shortly. You'll hear from us once it's on its way.
          </p>

          <!-- Order meta -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ec;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
            <tr>
              <td style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#8a7e6f;padding-bottom:10px;">Order ID</td>
              <td style="font-family:Arial,sans-serif;font-size:13px;color:#1f1a14;text-align:right;padding-bottom:10px;font-weight:600;">#${shortId}</td>
            </tr>
            <tr>
              <td style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#8a7e6f;">Payment</td>
              <td style="font-family:Arial,sans-serif;font-size:13px;color:#1f1a14;text-align:right;">${paymentLabel}</td>
            </tr>
          </table>

          <!-- Items -->
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8a7e6f;">Items ordered</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <thead>
              <tr>
                <th style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8a7e6f;font-weight:500;text-align:left;padding-bottom:8px;border-bottom:1px solid #ede8df;">Product</th>
                <th style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8a7e6f;font-weight:500;text-align:center;padding-bottom:8px;border-bottom:1px solid #ede8df;">Qty</th>
                <th style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8a7e6f;font-weight:500;text-align:right;padding-bottom:8px;border-bottom:1px solid #ede8df;">Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <!-- Totals -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td colspan="2" style="padding:6px 0;font-family:Arial,sans-serif;font-size:13px;color:#8a7e6f;">Subtotal</td>
              <td style="padding:6px 0;font-family:Arial,sans-serif;font-size:13px;color:#8a7e6f;text-align:right;">${formatPrice(args.subtotalCents, args.currency)}</td>
            </tr>
            ${discountRow}
            <tr>
              <td colspan="2" style="padding:6px 0;font-family:Arial,sans-serif;font-size:13px;color:#8a7e6f;">Shipping</td>
              <td style="padding:6px 0;font-family:Arial,sans-serif;font-size:13px;color:#8a7e6f;text-align:right;">${formatPrice(args.shippingCents, args.currency)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:10px 0 6px;border-top:1px solid #ede8df;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#1f1a14;">Total</td>
              <td style="padding:10px 0 6px;border-top:1px solid #ede8df;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#1f1a14;text-align:right;">${formatPrice(args.totalCents, args.currency)}</td>
            </tr>
          </table>

          <!-- Shipping address -->
          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8a7e6f;">Shipping to</p>
          <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:14px;color:#4b4339;line-height:1.6;">${args.shippingAddress}</p>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:8px;">
            <a href="${siteUrl}/products" style="display:inline-block;background:#1f1a14;color:#faf4e8;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:4px;">
              Continue Shopping
            </a>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:28px;text-align:center;">
          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;color:#8a7e6f;">Questions? Reply to this email or reach us at</p>
          <a href="mailto:Neuvescacosmetics@gmail.com" style="font-family:Arial,sans-serif;font-size:12px;color:#8a7e6f;">Neuvescacosmetics@gmail.com</a>
          <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#c4bdb0;">NEUVESCA · Cairo, Egypt</p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

export async function sendNewOrderNotification(args: OrderEmailArgs) {
  const transporter = getTransporter();
  if (!transporter) return;

  const shortId = args.orderId.slice(0, 8).toUpperCase();
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.neuvesca.com"}/admin/orders/${args.orderId}`;

  const itemRows = args.items
    .map((i) => `  • ${i.productName} × ${i.quantity} — ${formatPrice(i.unitPriceCents * i.quantity, args.currency)}`)
    .join("\n");

  const adminText = `New order on Neuvesca!\n\nOrder ID : ${shortId}\nCustomer : ${args.customerName} <${args.customerEmail}>\nPayment  : ${args.paymentMethod.replace(/_/g, " ")}\nTotal    : ${formatPrice(args.totalCents, args.currency)}\n\nItems:\n${itemRows}\n\nShip to:\n${args.shippingAddress}\n\nView order → ${adminUrl}`;

  await Promise.all([
    // Admin notification
    transporter.sendMail({
      from: `"Neuvesca Orders" <${process.env.EMAIL_USER}>`,
      to: "Neuvescacosmetics@gmail.com",
      subject: `New order — ${args.customerName} · ${formatPrice(args.totalCents, args.currency)}`,
      text: adminText,
    }),
    // Customer receipt (only if they provided an email)
    ...(args.customerEmail
      ? [
          transporter.sendMail({
            from: `"Neuvesca" <${process.env.EMAIL_USER}>`,
            to: args.customerEmail,
            subject: `Your Neuvesca order is confirmed — #${shortId}`,
            html: buildReceiptHtml(args),
          }),
        ]
      : []),
  ]);
}
