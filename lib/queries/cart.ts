import { createClient } from "@/lib/supabase/server";

export type ServerCartLine = {
  id: string;
  productId: string;
  scentId: string | null;
  quantity: number;
  productSlug: string;
  productName: string;
  productFamily: string;
  productImageUrl: string | null;
  productTone: string | null;
  unitPriceCents: number;
  currency: string;
  scentName: string | null;
  scentSlug: string | null;
};

type RawRow = {
  id: string;
  product_id: string;
  scent_id: string | null;
  quantity: number;
  products: {
    slug: string;
    name: string;
    family: string;
    image_url: string | null;
    tone: string | null;
    price_cents: number;
    currency: string;
  } | null;
  scents: { slug: string; name: string } | null;
};

export async function getServerCart(userId: string): Promise<ServerCartLine[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `id, product_id, scent_id, quantity,
       products ( slug, name, family, image_url, tone, price_cents, currency ),
       scents ( slug, name )`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as RawRow[])
    .filter((r) => r.products)
    .map((r) => ({
      id: r.id,
      productId: r.product_id,
      scentId: r.scent_id,
      quantity: r.quantity,
      productSlug: r.products!.slug,
      productName: r.products!.name,
      productFamily: r.products!.family,
      productImageUrl: r.products!.image_url,
      productTone: r.products!.tone,
      unitPriceCents: r.products!.price_cents,
      currency: r.products!.currency,
      scentName: r.scents?.name ?? null,
      scentSlug: r.scents?.slug ?? null,
    }));
}

export async function getServerCartCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", userId);
  return (data ?? []).reduce(
    (n, row) => n + (Number(row.quantity) || 0),
    0,
  );
}
