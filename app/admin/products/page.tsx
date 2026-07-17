import { createClient } from "@/lib/supabase/server";
import ProductsAdminClient, {
  type AdminProduct,
  type AdminScentOption,
} from "./ProductsAdminClient";

export default async function AdminProductsPage() {
  const supabase = createClient();
  const [{ data: products }, { data: scents }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `id, slug, name, description, family, burn_time_hours, tone, size_grams, price_cents, currency, image_url, gallery_image_urls, is_active, stock_units, category, show_description_tab, show_ingredients_tab,
         product_scents ( scent_id, note_role, sort_order )`,
      )
      .order("slug", { ascending: true }),
    supabase.from("scents").select("id, slug, name").order("name"),
  ]);

  return (
    <ProductsAdminClient
      initialProducts={(products ?? []) as unknown as AdminProduct[]}
      scents={(scents ?? []) as AdminScentOption[]}
    />
  );
}
