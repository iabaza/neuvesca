import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  listActiveProducts,
  type ProductCategory,
  type ProductListItem,
} from "@/lib/queries/products";
import { formatPrice, scentImageUrl, scentSwatchColor } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shop | Neuvesca",
  description:
    "The Neuvesca cabinet — body serum candles, hand-poured, each offered in several scents.",
};

const CATEGORY_SECTIONS: Array<{
  key: ProductCategory;
  title: string;
  blurb: string;
}> = [
  {
    key: "candles",
    title: "Candles",
    blurb: "Hand-poured body serum candles, offered in several scents.",
  },
  {
    key: "bundles",
    title: "Bundles",
    blurb: "Curated sets — paired pours and small saves.",
  },
  {
    key: "accessories",
    title: "Accessories",
    blurb: "Wick trimmers, snuffers, and the small things around a candle.",
  },
];

function ProductCard({ product }: { product: ProductListItem }) {
  const scentCount = product.primary_scents.length;
  const visibleScents = product.primary_scents.slice(0, 5);
  const overflow = scentCount - visibleScents.length;
  const href = `/products/${product.slug}`;
  return (
    <div className="productCard">
      <Link aria-label={product.name} className={`productVisual ${product.tone ?? ""}`} href={href}>
        {product.image_url ? (
          <Image
            alt={product.name}
            className="object-contain"
            fill
            sizes="(min-width: 980px) 30vw, 90vw"
            src={product.image_url}
          />
        ) : (
          <div className="candle">
            <span>Neuvesca</span>
          </div>
        )}
      </Link>
      <div className="productInfo">
        <Link className="productCardLink" href={href}>
          <div className="productCardHeader">
            <h3>{product.name}</h3>
            <span className="productCardPrice">
              {formatPrice(product.price_cents, product.currency)}
            </span>
          </div>
          <p>{product.description}</p>
        </Link>

        {scentCount > 0 && (
          <div className="productCardScents">
            <ul aria-label={`${scentCount} scents available`}>
              {visibleScents.map((s) => {
                const img = s.image_url ?? scentImageUrl(s.slug);
                return (
                  <li key={s.id} title={s.name}>
                    {img ? (
                      <Image alt="" fill sizes="28px" src={img} />
                    ) : (
                      <span
                        style={{
                          background: scentSwatchColor(s.slug),
                        }}
                      />
                    )}
                  </li>
                );
              })}
              {overflow > 0 && (
                <li className="productCardScentMore">+{overflow}</li>
              )}
            </ul>
            <span>
              {scentCount} {scentCount === 1 ? "scent" : "scents"}
            </span>
          </div>
        )}

        <div className="productMeta">
          <span>{product.family}</span>
          {product.burn_time_hours ? (
            <span>{product.burn_time_hours} hr burn</span>
          ) : null}
        </div>

        <div className="productCardFooter">
          <Link className="productCardCta" href={href}>View product →</Link>
          <Link className="productCardBuyNow" href={href}>Buy now</Link>
        </div>
      </div>
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const allProducts = await listActiveProducts();
  const query = searchParams.q?.trim().toLowerCase() ?? "";
  const products = query
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.family?.toLowerCase().includes(query),
      )
    : allProducts;

  const byCategory = new Map<ProductCategory, ProductListItem[]>();
  for (const p of products) {
    const cat = (p.category ?? "candles") as ProductCategory;
    const list = byCategory.get(cat) ?? [];
    list.push(p);
    byCategory.set(cat, list);
  }

  return (
    <>
      <section className="shopHero">
        <div aria-hidden="true" className="shopHeroOverlay" />
        <div className="shopHeroCopy">
          <p className="eyebrow">The shop</p>
          <h1>Body serum candles</h1>
          <p>
            Each candle is poured in a small batch and offered in six scents.
            Light the wick, allow the wax to melt into a warm nourishing serum,
            then gently massage it into your skin.
          </p>
        </div>
      </section>

      <section className="shopBar">
        <span className="shopCount">
          {query ? (
            <>
              {products.length} result{products.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </>
          ) : (
            <>{products.length} {products.length === 1 ? "product" : "products"}</>
          )}
        </span>
      </section>

      <section className="section shopGrid">
        {products.length === 0 ? (
          <div className="mx-auto max-w-md text-center">
            <p className="eyebrow">Nothing here yet</p>
            <h3 className="mb-3 [font-family:var(--serif)] text-[1.6rem] italic">
              The cabinet is being restocked.
            </h3>
            <p className="text-[var(--muted)]">
              Check back shortly — new pours arrive every few weeks.
            </p>
          </div>
        ) : (
          CATEGORY_SECTIONS.map((section) => {
            const items = byCategory.get(section.key) ?? [];
            if (items.length === 0) return null;
            return (
              <div
                className="shopCategorySection"
                key={section.key}
                id={section.key}
              >
                <header className="shopCategoryHeader">
                  <h2>{section.title}</h2>
                  <p>{section.blurb}</p>
                </header>
                <div className="productGrid productGridFull">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>

    </>
  );
}
