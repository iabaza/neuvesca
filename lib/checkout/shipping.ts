/**
 * Domestic Egypt shipping flat rates (in piastres — 1 EGP = 100 piastres).
 *   - Cairo: 100 EGP
 *   - Any other governorate: 130 EGP
 */

const CAIRO_FEE_CENTS = 100 * 100;
const OTHER_FEE_CENTS = 130 * 100;

function normalise(value: string) {
  return value.trim().toLowerCase();
}

function isCairo(city: string, region: string) {
  const haystack = `${normalise(city)} ${normalise(region)}`;
  // Match common English + Arabic spellings.
  return (
    haystack.includes("cairo") ||
    haystack.includes("القاهرة") ||
    haystack.includes("القاهره")
  );
}

export function calculateShippingCents(city: string, region: string) {
  return isCairo(city, region) ? CAIRO_FEE_CENTS : OTHER_FEE_CENTS;
}

export const SHIPPING_CAIRO_EGP = 100;
export const SHIPPING_OTHER_EGP = 130;
