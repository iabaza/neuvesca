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

type OrderNotificationArgs = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  currency: string;
  items: Array<{ productName: string; quantity: number; unitPriceCents: number }>;
  shippingAddress: string;
  paymentMethod: string;
};

export async function sendNewOrderNotification(args: OrderNotificationArgs) {
  const transporter = getTransporter();
  if (!transporter) return;

  const itemRows = args.items
    .map(
      (i) =>
        `  • ${i.productName} × ${i.quantity} — ${formatPrice(i.unitPriceCents * i.quantity, args.currency)}`,
    )
    .join("\n");

  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.neuvesca.com"}/admin/orders/${args.orderId}`;

  const text = `
New order on Neuvesca!

Order ID : ${args.orderId}
Customer : ${args.customerName} <${args.customerEmail}>
Payment  : ${args.paymentMethod.replace(/_/g, " ")}
Total    : ${formatPrice(args.totalCents, args.currency)}

Items:
${itemRows}

Ship to:
${args.shippingAddress}

View order → ${adminUrl}
`.trim();

  await transporter.sendMail({
    from: `"Neuvesca Orders" <${process.env.EMAIL_USER}>`,
    to: "Neuvescacosmetics@gmail.com",
    subject: `New order — ${args.customerName} · ${formatPrice(args.totalCents, args.currency)}`,
    text,
  });
}
