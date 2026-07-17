"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadProductImage } from "@/lib/storage";
import { formatPrice } from "@/lib/format";

export type AdminScentOption = {
  id: string;
  slug: string;
  name: string;
};

export type AdminProductCategory = "candles" | "bundles" | "accessories";

export const PRODUCT_CATEGORIES: Array<{
  value: AdminProductCategory;
  label: string;
}> = [
  { value: "candles", label: "Candles" },
  { value: "bundles", label: "Bundles" },
  { value: "accessories", label: "Accessories" },
];

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  family: string;
  burn_time_hours: number | null;
  tone: string | null;
  size_grams: number | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  gallery_image_urls: string[] | null;
  is_active: boolean;
  stock_units: number;
  category: AdminProductCategory;
  show_description_tab: boolean;
  show_ingredients_tab: boolean;
  product_scents: Array<{
    scent_id: string;
    note_role: "primary" | "top" | "heart" | "base";
    sort_order: number;
  }>;
};

type ProductForm = {
  slug: string;
  name: string;
  description: string;
  burn_time_hours: string;
  size_grams: string;
  price: string; // displayed in EGP, not cents
  stock_units: string;
  image_url: string;
  gallery_image_urls: string[];
  scent_ids: string[];
  category: AdminProductCategory;
  show_description_tab: boolean;
  show_ingredients_tab: boolean;
};

const DEFAULT_FAMILY = "Scented";
const DEFAULT_CURRENCY = "EGP";

function blankForm(): ProductForm {
  return {
    slug: "",
    name: "",
    description: "",
    burn_time_hours: "",
    size_grams: "",
    price: "48",
    stock_units: "100",
    image_url: "",
    gallery_image_urls: [],
    scent_ids: [],
    category: "candles",
    show_description_tab: true,
    show_ingredients_tab: true,
  };
}

function productToForm(product: AdminProduct): ProductForm {
  const scent_ids = product.product_scents
    .filter((row) => row.note_role === "primary")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => row.scent_id);

  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    burn_time_hours:
      product.burn_time_hours == null ? "" : String(product.burn_time_hours),
    size_grams: product.size_grams == null ? "" : String(product.size_grams),
    price: String(Math.round(product.price_cents / 100)),
    stock_units: String(product.stock_units ?? 0),
    image_url: product.image_url ?? "",
    gallery_image_urls: product.gallery_image_urls ?? [],
    scent_ids,
    category: (product.category ?? "candles") as AdminProductCategory,
    show_description_tab: product.show_description_tab ?? true,
    show_ingredients_tab: product.show_ingredients_tab ?? true,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ProductsAdminClient({
  initialProducts,
  scents,
}: {
  initialProducts: AdminProduct[];
  scents: AdminScentOption[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [products, setProducts] = useState(initialProducts);
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id ?? "");
  const [form, setForm] = useState<ProductForm>(
    initialProducts[0] ? productToForm(initialProducts[0]) : blankForm(),
  );
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedProduct = products.find((product) => product.id === selectedId);

  async function refreshProducts(nextSelectedId?: string) {
    const { data, error } = await supabase
      .from("products")
      .select(
        `id, slug, name, description, family, burn_time_hours, tone, size_grams, price_cents, currency, image_url, gallery_image_urls, is_active, stock_units, category, show_description_tab, show_ingredients_tab,
         product_scents ( scent_id, note_role, sort_order )`,
      )
      .order("slug", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    const next = (data ?? []) as unknown as AdminProduct[];
    setProducts(next);
    const activeId = nextSelectedId || selectedId || next[0]?.id || "";
    const active = next.find((product) => product.id === activeId);
    setSelectedId(active?.id ?? "");
    setForm(active ? productToForm(active) : blankForm());
  }

  function selectProduct(product: AdminProduct) {
    setSelectedId(product.id);
    setForm(productToForm(product));
    setMessage("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function newProduct() {
    setSelectedId("");
    setForm(blankForm());
    setMessage("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function updateField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleScent(scentId: string) {
    setForm((current) => {
      const has = current.scent_ids.includes(scentId);
      return {
        ...current,
        scent_ids: has
          ? current.scent_ids.filter((id) => id !== scentId)
          : [...current.scent_ids, scentId],
      };
    });
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const uploadFile = imageInputRef.current?.files?.[0];
      let imageUrl = form.image_url.trim() || null;
      if (uploadFile) {
        const uploaded = await uploadProductImage(uploadFile);
        imageUrl = uploaded.publicUrl;
      }

      const priceEgp = Number.parseFloat(form.price);
      const priceCents = Number.isFinite(priceEgp) && priceEgp >= 0
        ? Math.round(priceEgp * 100)
        : 0;
      const stockParsed = Number.parseInt(form.stock_units, 10);
      const stockUnits = Number.isFinite(stockParsed) && stockParsed >= 0
        ? stockParsed
        : 0;

      const burnParsed = Number.parseInt(form.burn_time_hours, 10);
      const burnTimeHours =
        Number.isFinite(burnParsed) && burnParsed > 0 ? burnParsed : null;

      const sizeParsed = Number.parseInt(form.size_grams, 10);
      const sizeGrams =
        Number.isFinite(sizeParsed) && sizeParsed > 0 ? sizeParsed : null;

      const payload = {
        slug: slugify(form.slug || form.name),
        name: form.name.trim(),
        description: form.description.trim(),
        family: DEFAULT_FAMILY,
        burn_time_hours: burnTimeHours,
        tone: null,
        size_grams: sizeGrams,
        price_cents: priceCents,
        currency: DEFAULT_CURRENCY,
        image_url: imageUrl,
        gallery_image_urls: form.gallery_image_urls,
        is_active: true,
        stock_units: stockUnits,
        category: form.category,
        show_description_tab: form.show_description_tab,
        show_ingredients_tab: form.show_ingredients_tab,
      };

      if (!payload.slug || !payload.name || !payload.description) {
        setMessage("Name, slug and description are required.");
        return;
      }

      let productId = selectedId;
      if (selectedProduct) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", selectedProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Replace the primary scent list — leave any composition (top/heart/base) alone.
      const { error: deletePrimaryError } = await supabase
        .from("product_scents")
        .delete()
        .eq("product_id", productId)
        .eq("note_role", "primary");
      if (deletePrimaryError) throw deletePrimaryError;

      if (form.scent_ids.length > 0) {
        const links = form.scent_ids.map((scent_id, index) => ({
          product_id: productId,
          scent_id,
          note_role: "primary" as const,
          sort_order: index,
        }));
        const { error: insertLinksError } = await supabase
          .from("product_scents")
          .insert(links);
        if (insertLinksError) throw insertLinksError;
      }

      if (imageInputRef.current) imageInputRef.current.value = "";
      await refreshProducts(productId);
      setMessage("Product saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save product.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProduct() {
    if (!selectedProduct) return;
    const ok = window.confirm(`Delete ${selectedProduct.name}?`);
    if (!ok) return;
    setIsSaving(true);
    setMessage("");
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", selectedProduct.id);
      if (error) throw error;
      setSelectedId("");
      setForm(blankForm());
      await refreshProducts();
      setMessage("Product deleted.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete product.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <header className="adminPageHead">
        <div>
          <p className="eyebrow">Products</p>
          <h1>Product cabinet.</h1>
          <p>
            Manage the seven essentials — name, slug, description, price,
            scents, image, burn time.
          </p>
        </div>
        <div className="adminButtonRow">
          <button
            className="adminButton adminButtonPrimary"
            onClick={newProduct}
            type="button"
          >
            + New product
          </button>
        </div>
      </header>

      <section className="adminSplit">
        <div className="adminTableWrap" style={{ maxHeight: "70vh", overflow: "auto" }}>
          <table className="adminTable">
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ textAlign: "right" }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td className="adminEmpty" colSpan={2}>
                    No products yet — create one.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    style={{
                      cursor: "pointer",
                      background:
                        product.id === selectedId
                          ? "var(--admin-line-soft)"
                          : undefined,
                    }}
                  >
                    <td>
                      <div style={{ display: "grid", gap: 2, lineHeight: 1.2 }}>
                        <span style={{ fontWeight: 500 }}>{product.name}</span>
                        <span style={{ color: "var(--admin-muted)", fontSize: "0.75rem" }}>
                          {product.slug}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatPrice(product.price_cents, product.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form className="adminCard adminForm" onSubmit={saveProduct}>
          <div className="adminPanelHead">
            <h2>{selectedProduct ? `Edit ${selectedProduct.name}` : "New product"}</h2>
          </div>

          <div className="adminFormGrid">
            <label className="adminFormRow">
              <span className="adminFormLabel">Name</span>
              <input
                className="adminInput"
                onChange={(e) => updateField("name", e.target.value)}
                required
                type="text"
                value={form.name}
              />
            </label>
            <label className="adminFormRow">
              <span className="adminFormLabel">Slug</span>
              <input
                className="adminInput"
                onBlur={() => updateField("slug", slugify(form.slug || form.name))}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="auto-from-name"
                type="text"
                value={form.slug}
              />
            </label>
          </div>

          <label className="adminFormRow">
            <span className="adminFormLabel">Description</span>
            <textarea
              className="adminTextarea"
              onChange={(e) => updateField("description", e.target.value)}
              required
              value={form.description}
            />
          </label>

          <label className="adminFormRow">
            <span className="adminFormLabel">Category</span>
            <select
              className="adminInput"
              onChange={(e) =>
                updateField("category", e.target.value as AdminProductCategory)
              }
              required
              value={form.category}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div className="adminFormGrid adminFormGrid3">
            <label className="adminFormRow">
              <span className="adminFormLabel">Price (EGP)</span>
              <input
                className="adminInput"
                min="0"
                onChange={(e) => updateField("price", e.target.value)}
                required
                step="0.01"
                type="number"
                value={form.price}
              />
            </label>
            <label className="adminFormRow">
              <span className="adminFormLabel">Units in stock</span>
              <input
                className="adminInput"
                min="0"
                onChange={(e) => updateField("stock_units", e.target.value)}
                required
                type="number"
                value={form.stock_units}
              />
            </label>
            <label className="adminFormRow">
              <span className="adminFormLabel">
                Burn time (hours){" "}
                <span style={{ color: "var(--admin-muted)", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>
                  — optional
                </span>
              </span>
              <input
                className="adminInput"
                min="1"
                onChange={(e) => updateField("burn_time_hours", e.target.value)}
                placeholder="leave blank to hide"
                type="number"
                value={form.burn_time_hours}
              />
            </label>
          </div>

          <label className="adminFormRow">
            <span className="adminFormLabel">
              Size (grams){" "}
              <span style={{ color: "var(--admin-muted)", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>
                — optional
              </span>
            </span>
            <input
              className="adminInput"
              min="1"
              onChange={(e) => updateField("size_grams", e.target.value)}
              placeholder="leave blank to hide"
              type="number"
              value={form.size_grams}
            />
          </label>

          <div className="adminFormRow">
            <span className="adminFormLabel">
              Scents{" "}
              <span style={{ color: "var(--admin-muted)", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>
                — optional, pick which scents this product comes in
              </span>
            </span>
            {scents.length === 0 ? (
              <p className="adminEmpty" style={{ padding: "0.6rem 0" }}>
                No scents yet — add some on the Scents page first.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "0.4rem",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                }}
              >
                {scents.map((scent) => {
                  const checked = form.scent_ids.includes(scent.id);
                  return (
                    <label
                      key={scent.id}
                      style={{
                        alignItems: "center",
                        background: checked ? "var(--admin-line-soft)" : "transparent",
                        border: "1px solid var(--admin-line)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        fontSize: "0.85rem",
                        gap: "0.5rem",
                        padding: "0.5rem 0.7rem",
                      }}
                    >
                      <input
                        checked={checked}
                        onChange={() => toggleScent(scent.id)}
                        type="checkbox"
                      />
                      <span>{scent.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="adminFormRow">
            <span className="adminFormLabel">Image URL</span>
            <input
              className="adminInput"
              onChange={(e) => updateField("image_url", e.target.value)}
              placeholder="https://… (or upload below)"
              type="url"
              value={form.image_url}
            />
          </div>

          <div className="adminFormRow">
            <span className="adminFormLabel">Or upload an image</span>
            <input
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="adminInput"
              ref={imageInputRef}
              type="file"
            />
          </div>

          <div className="adminFormRow">
            <span className="adminFormLabel">
              Gallery images{" "}
              <span style={{ color: "var(--admin-muted)", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>
                — extra photos shown on the product page
              </span>
            </span>

            {form.gallery_image_urls.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gap: "0.6rem",
                  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                  marginBottom: "0.6rem",
                }}
              >
                {form.gallery_image_urls.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    style={{
                      border: "1px solid var(--admin-line)",
                      borderRadius: 8,
                      overflow: "hidden",
                      position: "relative",
                      aspectRatio: "1 / 1",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt=""
                      src={url}
                      style={{
                        height: "100%",
                        objectFit: "cover",
                        width: "100%",
                      }}
                    />
                    <button
                      aria-label="Remove image"
                      onClick={() =>
                        setForm((curr) => ({
                          ...curr,
                          gallery_image_urls: curr.gallery_image_urls.filter(
                            (_, i) => i !== idx,
                          ),
                        }))
                      }
                      style={{
                        background: "rgba(31,26,20,0.7)",
                        border: 0,
                        borderRadius: 999,
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        height: 22,
                        lineHeight: 1,
                        position: "absolute",
                        right: 6,
                        top: 6,
                        width: 22,
                      }}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="adminInput"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                if (files.length === 0) return;
                setMessage("");
                try {
                  const uploads = await Promise.all(
                    files.map((f) => uploadProductImage(f)),
                  );
                  setForm((curr) => ({
                    ...curr,
                    gallery_image_urls: [
                      ...curr.gallery_image_urls,
                      ...uploads.map((u) => u.publicUrl),
                    ],
                  }));
                } catch (err) {
                  setMessage(
                    err instanceof Error
                      ? err.message
                      : "Could not upload one of the images.",
                  );
                }
              }}
              type="file"
            />
          </div>

          <div className="adminFormRow">
            <span className="adminFormLabel">Button visibility</span>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <label
                style={{
                  alignItems: "center",
                  background: form.show_description_tab ? "var(--admin-line-soft)" : "transparent",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  fontSize: "0.85rem",
                  gap: "0.6rem",
                  padding: "0.55rem 0.8rem",
                }}
              >
                <input
                  checked={form.show_description_tab}
                  onChange={(e) => updateField("show_description_tab", e.target.checked)}
                  type="checkbox"
                />
                <span>Show <strong>Description</strong> tab on product page</span>
              </label>
              <label
                style={{
                  alignItems: "center",
                  background: form.show_ingredients_tab ? "var(--admin-line-soft)" : "transparent",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  fontSize: "0.85rem",
                  gap: "0.6rem",
                  padding: "0.55rem 0.8rem",
                }}
              >
                <input
                  checked={form.show_ingredients_tab}
                  onChange={(e) => updateField("show_ingredients_tab", e.target.checked)}
                  type="checkbox"
                />
                <span>Show <strong>Ingredients</strong> tab on product page</span>
              </label>
            </div>
          </div>

          {message && <div className="adminToast">{message}</div>}

          <div className="adminButtonRow">
            {selectedProduct && (
              <button
                className="adminButton adminButtonDanger"
                disabled={isSaving}
                onClick={deleteProduct}
                type="button"
              >
                Delete
              </button>
            )}
            <button
              className="adminButton adminButtonPrimary"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving…" : selectedProduct ? "Save changes" : "Create product"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
