import { createClient } from "@/lib/supabase/server";
import { getServerCartCount } from "@/lib/queries/cart";
import { listActiveProducts } from "@/lib/queries/products";
import SiteHeaderNav from "./SiteHeaderNav";

export default async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  const [initialCount, allProducts] = await Promise.all([
    user ? getServerCartCount(user.id) : Promise.resolve(0),
    listActiveProducts(),
  ]);

  const searchProducts = allProducts.map((p) => ({
    name: p.name,
    slug: p.slug,
    image_url: p.image_url ?? null,
    family: p.family ?? null,
  }));

  return (
    <SiteHeaderNav
      initialCount={initialCount}
      isAuthenticated={Boolean(user)}
      searchProducts={searchProducts}
    />
  );
}
