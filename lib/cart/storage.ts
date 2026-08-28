export type GuestCartLine = {
  productId: string;
  /** Single scent pick — used when the product's bundle_size is 1. */
  scentId: string | null;
  /** Multiple scent picks for a bundle (bundle_size > 1). Empty otherwise. */
  scentIds: string[];
  quantity: number;
};

const STORAGE_KEY = "neuvesca.cart.v1";

function isLine(value: unknown): value is GuestCartLine {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const scentIdsOk =
    v.scentIds === undefined ||
    (Array.isArray(v.scentIds) && v.scentIds.every((s) => typeof s === "string"));
  return (
    typeof v.productId === "string" &&
    (typeof v.scentId === "string" || v.scentId === null) &&
    scentIdsOk &&
    typeof v.quantity === "number" &&
    v.quantity > 0
  );
}

/** Normalizes a line read from storage — older saved carts never had scentIds. */
function normalize(line: GuestCartLine): GuestCartLine {
  return { ...line, scentIds: Array.isArray(line.scentIds) ? line.scentIds : [] };
}

export function getGuestCart(): GuestCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isLine).map(normalize) : [];
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

/**
 * Identifies a distinct cart line: same product and same scent selection.
 * For a bundle, scentIds order doesn't change what was bought (2x vanilla +
 * 1x coconut is the same line regardless of pick order), so the key sorts a
 * copy before joining.
 */
export function lineKey(
  productId: string,
  scentId: string | null,
  scentIds: string[] = [],
) {
  if (scentIds.length > 0) {
    return `${productId}:bundle:${[...scentIds].sort().join(",")}`;
  }
  return `${productId}:${scentId ?? "none"}`;
}

export function mergeGuestLine(
  lines: GuestCartLine[],
  add: GuestCartLine,
): GuestCartLine[] {
  const addKey = lineKey(add.productId, add.scentId, add.scentIds);
  const idx = lines.findIndex(
    (l) => lineKey(l.productId, l.scentId, l.scentIds) === addKey,
  );
  if (idx === -1) return [...lines, add];
  const next = [...lines];
  next[idx] = { ...next[idx], quantity: next[idx].quantity + add.quantity };
  return next;
}
