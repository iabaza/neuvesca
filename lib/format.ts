export function formatPrice(cents: number, currency = "EGP") {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * The price a customer actually pays for a product.
 *
 * Every surface that shows or charges a price must go through this — the cart,
 * checkout totals and order lines included — so a product can never be
 * advertised at a discount but billed at full price.
 */
export function effectivePriceCents(
  priceCents: number,
  discountPercent?: number | null,
): number {
  const pct = clampDiscountPercent(discountPercent);
  if (pct === 0) return priceCents;
  return Math.round((priceCents * (100 - pct)) / 100);
}

export function clampDiscountPercent(discountPercent?: number | null): number {
  const pct = Math.round(Number(discountPercent ?? 0));
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return Math.min(100, pct);
}

export function hasDiscount(discountPercent?: number | null): boolean {
  return clampDiscountPercent(discountPercent) > 0;
}

export function scentSwatchColor(slug: string) {
  // Deterministic HSL from slug — lets us render a color swatch without a DB column.
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue} 32% 62%)`;
}

const SCENT_IMAGES: Record<string, string> = {
  "pomegranate": "/images/scents/pomegranate.jpeg",
  "coconut": "/images/scents/coconut.jpeg",
  "vanilla": "/images/scents/vanilla.jpeg",
  "honey": "/images/scents/honey.jpeg",
  "smoked-vanilla": "/images/scents/vanilla.jpeg",
  "amber-resin": "/images/scents/honey.jpeg",
  "tonka": "/images/scents/honey.jpeg",
  "saffron": "/images/scents/honey.jpeg",
  "cedar": "/images/scents/sandalwood.jpeg",
  "cedar-ember": "/images/scents/sandalwood.jpeg",
  "vetiver": "/images/scents/sandalwood.jpeg",
  "birch-tar": "/images/scents/sandalwood.jpeg",
  "black-fig": "/images/scents/pomegranate.jpeg",
  "violet-leaf": "/images/scents/pomegranate.jpeg",
  "clary-sage": "/images/ingredients/leaves.jpeg",
  "fig-leaf": "/images/ingredients/leaves.jpeg",
  "white-tea": "/images/ingredients/leaves.jpeg",
  "cardamom": "/images/ingredients/dates.jpeg",
  "linen": "/images/scents/coconut.jpeg",
  "pale-musk": "/images/scents/coconut.jpeg",
  "rainwater": "/images/ingredients/olive-oil.jpeg",
  "neroli": "/images/ingredients/olive-oil.jpeg",
};

export function scentImageUrl(slug: string): string | null {
  return SCENT_IMAGES[slug] ?? null;
}
