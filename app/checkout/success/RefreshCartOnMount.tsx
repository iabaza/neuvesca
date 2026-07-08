"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/CartProvider";

export default function RefreshCartOnMount() {
  const { refresh, clearCart } = useCart();
  useEffect(() => {
    // Best-effort: for logged-in users the server already emptied cart_items;
    // for guests this clears their localStorage cart.
    clearCart().catch(() => refresh());
  }, [refresh, clearCart]);
  return null;
}
