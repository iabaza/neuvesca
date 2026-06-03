export type CartItem = {
  id: string; // For DB rows = cart_items.id, for guest = `${productId}:${scentId ?? "none"}`
  productId: string;
  scentId: string | null;
  quantity: number;
  productSlug: string;
  productName: string;
  productImageUrl: string | null;
  productTone: string | null;
  unitPriceCents: number;
  currency: string;
  scentName: string | null;
  scentSlug: string | null;
};
