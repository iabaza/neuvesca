import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/queries/products";
import { formatPrice } from "@/lib/format";
import ProductGallery from "./ProductGallery";
import ProductPurchasePanel from "./ProductPurchasePanel";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Not found | Neuvesca" };
  return {
    title: `${product.name} | Neuvesca`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const { composition, ingredients } = product;
  const priceLabel = formatPrice(product.price_cents, product.currency);

  const galleryImages = [
    product.image_url,
    ...(product.gallery_image_urls ?? []),
  ].filter((u): u is string => Boolean(u));
  const fallbackImages =
    galleryImages.length > 0 ? galleryImages : ["/images/redsign1.jpeg"];

  return (
    <article className="productDetail">
      <div className="productDetailMain">
        <aside className="productGallery">
          <ProductGallery alt={product.name} images={fallbackImages} />
        </aside>

        <section className="productPanel">
          <header className="productHeader">
            <p className="eyebrow">{product.family}</p>
            <h1>{product.name}</h1>
            <p className="lede">{product.description}</p>
          </header>

          <ProductPurchasePanel
            burnTimeHours={product.burn_time_hours}
            priceLabel={priceLabel}
            primaryScents={product.primary_scents}
            productId={product.id}
            sizeGrams={product.size_grams}
          />

          {(composition.top.length > 0 ||
            composition.heart.length > 0 ||
            composition.base.length > 0) && (
            <section className="grid gap-3 border-t border-[var(--line-soft)] pt-6">
              <p className="eyebrow !mb-0">Composition</p>
              <dl className="grid gap-3">
                {(["top", "heart", "base"] as const).map((role) => {
                  const list = composition[role];
                  if (list.length === 0) return null;
                  return (
                    <div className="grid grid-cols-[6rem_1fr] gap-3" key={role}>
                      <dt className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--muted)]">
                        {role}
                      </dt>
                      <dd className="[font-family:var(--serif)] text-[1.05rem] italic">
                        {list.map((s) => s.name).join(", ")}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          )}

          <section className="grid gap-3 border-t border-[var(--line-soft)] pt-6">
            <p className="eyebrow !mb-0">Ingredients</p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-[0.95rem] text-[var(--ink-soft)]">
              {ingredients.map((ing) => (
                <li
                  className="border border-[var(--line)] px-3 py-1.5"
                  key={ing.id}
                >
                  <Link
                    className="text-[0.78rem] uppercase tracking-[0.2em] hover:text-[var(--clay)]"
                    href={`/ingredients#${ing.slug}`}
                  >
                    {ing.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </section>
      </div>

      <section
        aria-label="The ritual"
        className="grid items-center gap-[clamp(2.5rem,5vw,5rem)] bg-[var(--ink)] px-[clamp(1.25rem,5vw,5.5rem)] py-[clamp(4rem,7vw,7rem)] text-[var(--cream)] md:grid-cols-[0.95fr_1.05fr]"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <Image
            alt="Neuvesca candle in evening light"
            className="object-cover"
            fill
            sizes="(min-width: 768px) 45vw, 90vw"
            src="/images/redsign1.jpeg"
          />
        </div>
        <div className="grid gap-5 max-w-[34rem]">
          <p
            className="m-0 text-[0.7rem] font-medium uppercase tracking-[0.32em]"
            style={{ color: "var(--tan)" }}
          >
            The ritual
          </p>
          <h2 className="!m-0 [font-family:var(--serif)] text-[clamp(2rem,3.4vw,3.2rem)] !text-[var(--cream)]">
            Light. Pool. Pour. Massage.
          </h2>
          <p className="text-[1rem] leading-[1.8] text-[rgba(250,244,232,0.7)]">
            Light the wick and let the wax pool transform into a warm,
            nourishing serum. After ten minutes, blow out the flame, let the
            pool settle for a moment, then pour into the palm and massage into
            skin while still tepid. The candle becomes a balm; the room keeps
            its quiet glow.
          </p>
          <Link className="tertiary mt-1" href="/ingredients">
            Read the ingredient list
          </Link>
        </div>
      </section>
    </article>
  );
}
