import { createClient } from "@/lib/supabase/server";

export type ProductCategory = "candles" | "bundles" | "accessories";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  family: string;
  burn_time_hours: number | null;
  tone: string | null;
  size_grams: number | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  gallery_image_urls: string[];
  is_active: boolean;
  category: ProductCategory;
};

export type ScentRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  family: string | null;
  image_url: string | null;
};

export type IngredientRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  safety_notes: string | null;
};

export type ProductListItem = ProductRow & {
  primary_scents: ScentRow[];
};

export type ProductDetail = ProductRow & {
  primary_scents: ScentRow[];
  composition: { top: ScentRow[]; heart: ScentRow[]; base: ScentRow[] };
  ingredients: IngredientRow[];
};

type RawListRow = ProductRow & {
  product_scents: Array<{
    note_role: "top" | "heart" | "base" | "primary";
    sort_order: number;
    scents: ScentRow | null;
  }>;
};

type RawDetailRow = RawListRow & {
  product_ingredients: Array<{
    sort_order: number;
    ingredients: IngredientRow | null;
  }>;
};

function pickScents(
  rows: RawListRow["product_scents"],
  role: "top" | "heart" | "base" | "primary",
): ScentRow[] {
  return rows
    .filter((r) => r.note_role === role && r.scents)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => r.scents as ScentRow);
}

export async function listActiveProducts(filters?: {
  scentSlug?: string;
}): Promise<ProductListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, name, description, family, burn_time_hours, tone, size_grams, price_cents, currency, image_url, gallery_image_urls, is_active, category,
       product_scents ( note_role, sort_order, scents ( id, slug, name, description, family, image_url ) )`,
    )
    .eq("is_active", true)
    .order("slug", { ascending: true });

  if (error) throw error;

  const products = (data ?? []) as unknown as RawListRow[];
  const list = products.map((p) => ({
    ...p,
    primary_scents: pickScents(p.product_scents, "primary"),
  }));

  if (filters?.scentSlug) {
    return list.filter((p) =>
      p.primary_scents.some((s) => s.slug === filters.scentSlug),
    );
  }

  return list;
}

export async function listAllPrimaryScents(): Promise<ScentRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_scents")
    .select("scents ( id, slug, name, description, family, image_url )")
    .eq("note_role", "primary");

  if (error) throw error;

  const seen = new Map<string, ScentRow>();
  for (const row of (data ?? []) as unknown as Array<{ scents: ScentRow | null }>) {
    if (row.scents && !seen.has(row.scents.slug)) {
      seen.set(row.scents.slug, row.scents);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, name, description, family, burn_time_hours, tone, size_grams, price_cents, currency, image_url, gallery_image_urls, is_active, category,
       product_scents ( note_role, sort_order, scents ( id, slug, name, description, family, image_url ) ),
       product_ingredients ( sort_order, ingredients ( id, slug, name, description, safety_notes ) )`,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as RawDetailRow;
  return {
    ...row,
    primary_scents: pickScents(row.product_scents, "primary"),
    composition: {
      top: pickScents(row.product_scents, "top"),
      heart: pickScents(row.product_scents, "heart"),
      base: pickScents(row.product_scents, "base"),
    },
    ingredients: row.product_ingredients
      .filter((r) => r.ingredients)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((r) => r.ingredients as IngredientRow),
  };
}
