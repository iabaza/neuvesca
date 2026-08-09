"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics/meta";

type Props = {
  orderId: string;
  contentIds: string[];
  numItems: number;
  valueCents: number;
  currency: string;
};

/**
 * Fires the Meta "Purchase" event for a completed order.
 *
 * This is the event ad delivery optimises against, so the value must be the
 * real order total. trackPurchase guards on order id, so refreshing or
 * re-opening this page cannot report the same sale twice.
 */
export default function TrackPurchase(props: Props) {
  useEffect(() => {
    trackPurchase(props);
    // Order id identifies the conversion; the rest is derived from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.orderId]);

  return null;
}
