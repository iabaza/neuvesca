import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MetaPixel from "@/components/MetaPixel";
import { CartProvider } from "@/lib/cart/CartProvider";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Neuvesca | Scented Candles",
  description:
    "Quietly luxurious scented candles poured for evening rituals, slow mornings, and softened spaces.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <MetaPixel />
        <CartProvider
          initialIsAuthenticated={Boolean(user)}
          initialUserId={user?.id ?? null}
        >
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
