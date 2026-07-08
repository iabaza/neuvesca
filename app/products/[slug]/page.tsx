import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/queries/products";
import ProductView from "./ProductView";

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

  return (
    <article className="productDetail">
      <ProductView product={product} />

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
