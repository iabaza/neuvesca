-- Allow cart_items.scent_id to be NULL so products without scents (accessories,
-- bundles, etc.) can be added to the cart.

alter table public.cart_items
  alter column scent_id drop not null;

-- Drop the old strict unique constraint that doesn't tolerate NULL values.
alter table public.cart_items
  drop constraint if exists cart_items_user_product_scent_unique;

-- One row per (user, product, scent) when scent_id is set …
create unique index if not exists cart_items_user_product_scent_unique
  on public.cart_items (user_id, product_id, scent_id)
  where scent_id is not null;

-- … and one row per (user, product) when scent_id is null.
create unique index if not exists cart_items_user_product_no_scent_unique
  on public.cart_items (user_id, product_id)
  where scent_id is null;
