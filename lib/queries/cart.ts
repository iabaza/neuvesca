import { createClient } from "@/lib/supabase/server";
import { effectivePriceCents } from "@/lib/format";

export type ServerCartLine = {
  id: string;
  productId: string;
  /** Single scent pick — used when the product's bundle_size is 1 (the common case). */
  scentId: string | null;
  quantity: number;
  productSlug: string;
  productName: string;
  productFamily: string | null;
  productImageUrl: string | null;
  productTone: string | null;
  /** What the customer is charged — already has any product discount applied. */
  unitPriceCents: number;
  /** Pre-discount price, for showing a struck-through original. */
  listPriceCents: number;
  discountPercent: number;
  currency: string;
  scentName: string | null;
  scentSlug: string | null;
  /**
   * Multiple scent picks for a bundle (bundle_size > 1) — one entry per
   * candle in the bundle, duplicates allowed. Empty for ordinary products;
   * scentId/scentName are used instead in that case.
   */
  scentIds: string[];
  scentNames: string[];
};

type RawRow = {
  id: string;
  product_id: string;
  scent_id: string | null;
  scent_ids: string[] | null;
  quantity: number;
  products: {
    slug: string;
    name: string;
    family: string;
    image_url: string | null;
    tone: string | null;
    price_cents: number;
    discount_percent: number | null;
    currency: string;
  } | null;
  scents: { slug: string; name: string } | null;
};

export async function getServerCart(userId: string): Promise<ServerCartLine[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `id, product_id, scent_id, scent_ids, quantity,
       products ( slug, name, family, image_url, tone, price_cents, discount_percent, currency ),
       scents ( slug, name )`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = ((data ?? []) as unknown as RawRow[]).filter((r) => r.products);

  // scent_ids is a plain array column, not a foreign key PostgREST can embed,
  // so bundle scent names need their own lookup.
  const bundleScentIds = Array.from(
    new Set(rows.flatMap((r) => r.scent_ids ?? [])),
  );
  const { data: bundleScents } = bundleScentIds.length
    ? await supabase.from("scents").select("id, name").in("id", bundleScentIds)
    : { data: [] as Array<{ id: string; name: string }> };
  const bundleScentMap = new Map(
    (bundleScents ?? []).map((s) => [s.id, s.name]),
  );

  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    scentId: r.scent_id,
    scentIds: r.scent_ids ?? [],
    quantity: r.quantity,
    productSlug: r.products!.slug,
    productName: r.products!.name,
    productFamily: r.products!.family,
    productImageUrl: r.products!.image_url,
    productTone: r.products!.tone,
    unitPriceCents: effectivePriceCents(
      r.products!.price_cents,
      r.products!.discount_percent,
    ),
    listPriceCents: r.products!.price_cents,
    discountPercent: r.products!.discount_percent ?? 0,
    currency: r.products!.currency,
    scentName: r.scents?.name ?? null,
    scentSlug: r.scents?.slug ?? null,
    scentNames: (r.scent_ids ?? []).map((id) => bundleScentMap.get(id) ?? ""),
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
