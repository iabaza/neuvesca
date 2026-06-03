export type GuestCartLine = {
  productId: string;
  scentId: string | null;
  quantity: number;
};

const STORAGE_KEY = "neuvesca.cart.v1";

function isLine(value: unknown): value is GuestCartLine {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.productId === "string" &&
    (typeof v.scentId === "string" || v.scentId === null) &&
    typeof v.quantity === "number" &&
    v.quantity > 0
  );
}

export function getGuestCart(): GuestCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isLine) : [];
  } catch {
    return [];
  }
}

export function setGuestCart(lines: GuestCartLine[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

export function clearGuestCart() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function lineKey(productId: string, scentId: string | null) {
  return `${productId}:${scentId ?? "none"}`;
}

export function mergeGuestLine(
  lines: GuestCartLine[],
  add: GuestCartLine,
): GuestCartLine[] {
  const idx = lines.findIndex(
    (l) => l.productId === add.productId && l.scentId === add.scentId,
  );
  if (idx === -1) return [...lines, add];
  const next = [...lines];
  next[idx] = { ...next[idx], quantity: next[idx].quantity + add.quantity };
  return next;
}
