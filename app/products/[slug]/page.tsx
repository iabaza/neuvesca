import type { Metadata } from "next";
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
    </article>
  );
}
