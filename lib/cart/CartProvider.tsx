"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  clearGuestCart,
  getGuestCart,
  lineKey,
  mergeGuestLine,
  setGuestCart,
  type GuestCartLine,
} from "./storage";
import type { CartItem } from "./types";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  addToCart: (
    productId: string,
    scentId: string | null,
    quantity?: number,
  ) => Promise<void>;
  updateQty: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

type ProductLookup = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  tone: string | null;
  price_cents: number;
  currency: string;
};

type ScentLookup = { id: string; slug: string; name: string };

async function hydrateGuest(
  lines: GuestCartLine[],
  supabase: ReturnType<typeof createClient>,
): Promise<CartItem[]> {
  if (lines.length === 0) return [];
  const productIds = Array.from(new Set(lines.map((l) => l.productId)));
  const scentIds = Array.from(
    new Set(lines.map((l) => l.scentId).filter((s): s is string => Boolean(s))),
  );

  const [{ data: products }, { data: scents }] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, name, image_url, tone, price_cents, currency")
      .in("id", productIds),
    scentIds.length > 0
      ? supabase.from("scents").select("id, slug, name").in("id", scentIds)
      : Promise.resolve({ data: [] as ScentLookup[] }),
  ]);

  const productMap = new Map<string, ProductLookup>(
    ((products ?? []) as ProductLookup[]).map((p) => [p.id, p]),
  );
  const scentMap = new Map<string, ScentLookup>(
    ((scents ?? []) as ScentLookup[]).map((s) => [s.id, s]),
  );

  return lines
    .map((l): CartItem | null => {
      const p = productMap.get(l.productId);
      const s = l.scentId ? scentMap.get(l.scentId) ?? null : null;
      if (!p) return null;
      if (l.scentId && !s) return null;
      return {
        id: lineKey(l.productId, l.scentId),
        productId: l.productId,
        scentId: l.scentId,
        quantity: l.quantity,
        productSlug: p.slug,
        productName: p.name,
        productImageUrl: p.image_url,
        productTone: p.tone,
        unitPriceCents: p.price_cents,
        currency: p.currency,
        scentName: s?.name ?? null,
        scentSlug: s?.slug ?? null,
      };
    })
    .filter((x): x is CartItem => x !== null);
}

async function loadAuthedCart(
  userId: string,
  supabase: ReturnType<typeof createClient>,
): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `id, product_id, scent_id, quantity,
       products ( slug, name, image_url, tone, price_cents, currency ),
       scents ( slug, name )`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  type Row = {
    id: string;
    product_id: string;
    scent_id: string | null;
    quantity: number;
    products: {
      slug: string;
      name: string;
      image_url: string | null;
      tone: string | null;
      price_cents: number;
      currency: string;
    } | null;
    scents: { slug: string; name: string } | null;
  };

  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.products)
    .map((r) => ({
      id: r.id,
      productId: r.product_id,
      scentId: r.scent_id,
      quantity: r.quantity,
      productSlug: r.products!.slug,
      productName: r.products!.name,
      productImageUrl: r.products!.image_url,
      productTone: r.products!.tone,
      unitPriceCents: r.products!.price_cents,
      currency: r.products!.currency,
      scentName: r.scents?.name ?? null,
      scentSlug: r.scents?.slug ?? null,
    }));
}

async function mergeGuestIntoDb(
  userId: string,
  guestLines: GuestCartLine[],
  supabase: ReturnType<typeof createClient>,
) {
  if (guestLines.length === 0) return;

  const { data: existing } = await supabase
    .from("cart_items")
    .select("product_id, scent_id, quantity")
    .eq("user_id", userId);

  const existingMap = new Map<string, number>(
    ((existing ?? []) as Array<{
      product_id: string;
      scent_id: string | null;
      quantity: number;
    }>).map((row) => [lineKey(row.product_id, row.scent_id), row.quantity]),
  );

  for (const line of guestLines) {
    const key = lineKey(line.productId, line.scentId);
    const existingQty = existingMap.get(key) ?? 0;
    const nextQty = existingQty + line.quantity;

    if (existingQty > 0) {
      let query = supabase
        .from("cart_items")
        .update({ quantity: nextQty })
        .eq("user_id", userId)
        .eq("product_id", line.productId);
      query = line.scentId
        ? query.eq("scent_id", line.scentId)
        : query.is("scent_id", null);
      await query;
    } else {
      await supabase.from("cart_items").insert({
        user_id: userId,
        product_id: line.productId,
        scent_id: line.scentId,
        quantity: line.quantity,
      });
    }
  }
}

type Props = {
  children: ReactNode;
  initialIsAuthenticated: boolean;
  initialUserId: string | null;
};

export function CartProvider({
  children,
  initialIsAuthenticated,
  initialUserId,
}: Props) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [items, setItems] = useState<CartItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialIsAuthenticated,
  );
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [isLoading, setIsLoading] = useState(true);
  const mergedRef = useRef(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      if (userId) {
        const dbItems = await loadAuthedCart(userId, supabase);
        setItems(dbItems);
      } else {
        const guest = getGuestCart();
        const hydrated = await hydrateGuest(guest, supabase);
        setItems(hydrated);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  // Initial hydrate + auth state listener.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (cancelled) return;
      setIsAuthenticated(Boolean(user));
      setUserId(user?.id ?? null);

      if (user && !mergedRef.current) {
        mergedRef.current = true;
        const guest = getGuestCart();
        if (guest.length > 0) {
          await mergeGuestIntoDb(user.id, guest, supabase);
          clearGuestCart();
        }
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setIsAuthenticated(Boolean(user));
      setUserId(user?.id ?? null);

      if (user && !mergedRef.current) {
        mergedRef.current = true;
        const guest = getGuestCart();
        if (guest.length > 0) {
          await mergeGuestIntoDb(user.id, guest, supabase);
          clearGuestCart();
        }
      }
      if (!user) {
        mergedRef.current = false;
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Reload items when auth changes.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = useCallback(
    async (productId: string, scentId: string | null, quantity = 1) => {
      if (userId) {
        const existing = items.find(
          (i) => i.productId === productId && i.scentId === scentId,
        );
        if (existing) {
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + quantity })
            .eq("id", existing.id);
        } else {
          await supabase.from("cart_items").insert({
            user_id: userId,
            product_id: productId,
            scent_id: scentId,
            quantity,
          });
        }
      } else {
        const merged = mergeGuestLine(getGuestCart(), {
          productId,
          scentId,
          quantity,
        });
        setGuestCart(merged);
      }
      await refresh();
    },
    [items, refresh, supabase, userId],
  );

  const updateQty = useCallback(
    async (lineId: string, quantity: number) => {
      const safe = Math.max(1, Math.min(99, Math.floor(quantity)));
      // Optimistic update — no loading flash
      setItems((prev) =>
        prev.map((i) => (i.id === lineId ? { ...i, quantity: safe } : i)),
      );
      if (userId) {
        await supabase
          .from("cart_items")
          .update({ quantity: safe })
          .eq("id", lineId);
      } else {
        const guest = getGuestCart();
        const next = guest.map((l) =>
          lineKey(l.productId, l.scentId) === lineId
            ? { ...l, quantity: safe }
            : l,
        );
        setGuestCart(next);
      }
    },
    [supabase, userId],
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      // Optimistic update — no loading flash
      setItems((prev) => prev.filter((i) => i.id !== lineId));
      if (userId) {
        await supabase.from("cart_items").delete().eq("id", lineId);
      } else {
        const guest = getGuestCart().filter(
          (l) => lineKey(l.productId, l.scentId) !== lineId,
        );
        setGuestCart(guest);
      }
    },
    [supabase, userId],
  );

  const clearCart = useCallback(async () => {
    if (userId) {
      await supabase.from("cart_items").delete().eq("user_id", userId);
    } else {
      clearGuestCart();
    }
    await refresh();
  }, [refresh, supabase, userId]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotalCents = items.reduce(
      (n, i) => n + i.quantity * i.unitPriceCents,
      0,
    );
    return {
      items,
      count,
      subtotalCents,
      isAuthenticated,
      isLoading,
      addToCart,
      updateQty,
      removeItem,
      clearCart,
      refresh,
    };
  }, [
    addToCart,
    clearCart,
    isAuthenticated,
    isLoading,
    items,
    refresh,
    removeItem,
    updateQty,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
