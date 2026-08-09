/**
 * Meta Pixel standard events.
 *
 * These are the events an advertiser optimises campaigns against — Meta only
 * understands its own standard event names, so the names below are fixed and
 * must not be renamed. `Purchase` in particular is what ad delivery is trained
 * on, so its `value` must be the real amount charged.
 *
 * Every call is a no-op if the pixel has not loaded (ad blocker, bot, script
 * still in flight), so tracking can never break a page.
 */

type Fbq = (...args: unknown[]) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { fbq?: Fbq }).fbq ?? null;
}

function track(event: string, params?: Record<string, unknown>, eventId?: string) {
  const fbq = getFbq();
  if (!fbq) return;
  // eventID lets Meta de-duplicate if a Conversions API server event is added
  // later for the same action.
  if (eventId) fbq("track", event, params ?? {}, { eventID: eventId });
  else fbq("track", event, params ?? {});
}

/** Price in cents -> the major-unit number Meta expects (750_00 -> 750). */
function toMajorUnits(cents: number): number {
  return Math.round(cents) / 100;
}

export type TrackedProduct = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  category?: string | null;
};

/** Someone opened a product page. */
export function trackViewContent(product: TrackedProduct) {
  track("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    content_category: product.category ?? undefined,
    value: toMajorUnits(product.priceCents),
    currency: product.currency,
  });
}

/** Someone added a product to the bag. */
export function trackAddToCart(product: TrackedProduct, quantity: number) {
  track("AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    contents: [{ id: product.id, quantity }],
    value: toMajorUnits(product.priceCents * quantity),
    currency: product.currency,
  });
}

/** Someone reached checkout. */
export function trackInitiateCheckout(args: {
  contentIds: string[];
  numItems: number;
  valueCents: number;
  currency: string;
}) {
  track("InitiateCheckout", {
    content_ids: args.contentIds,
    content_type: "product",
    num_items: args.numItems,
    value: toMajorUnits(args.valueCents),
    currency: args.currency,
  });
}

/**
 * An order was actually paid for / placed.
 *
 * Fires at most once per order id — the success page can be refreshed or
 * revisited, and a double-counted Purchase would inflate reported revenue and
 * mistrain ad delivery.
 */
export function trackPurchase(args: {
  orderId: string;
  contentIds: string[];
  numItems: number;
  valueCents: number;
  currency: string;
}) {
  if (typeof window === "undefined") return;

  const key = `nv_purchase_tracked_${args.orderId}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Private mode / storage disabled — better to risk a duplicate than to
    // lose the conversion entirely.
  }

  track(
    "Purchase",
    {
      content_ids: args.contentIds,
      content_type: "product",
      num_items: args.numItems,
      value: toMajorUnits(args.valueCents),
      currency: args.currency,
    },
    args.orderId,
  );
}
