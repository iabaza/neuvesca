export type CartItem = {
  id: string; // For DB rows = cart_items.id, for guest = `${productId}:${scentId ?? "none"}`
  productId: string;
  /** Single scent pick — used when the product's bundle_size is 1 (the common case). */
  scentId: string | null;
  quantity: number;
  productSlug: string;
  productName: string;
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
