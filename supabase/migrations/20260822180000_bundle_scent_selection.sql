-- Lets a product require more than one scent pick (candle bundles), and keeps
-- a durable record of exactly which scents were chosen once an order is
-- placed — order_items previously stored no scent information at all.

alter table public.products
  add column if not exists bundle_size integer not null default 1;

alter table public.products
  drop constraint if exists products_bundle_size_valid;

alter table public.products
  add constraint products_bundle_size_valid
  check (bundle_size >= 1 and bundle_size <= 10);

-- Multi-scent selection for a single cart line, used only when the product's
-- bundle_size > 1. For bundle_size = 1 this stays empty and the existing
-- scent_id column keeps doing all the work, unchanged.
alter table public.cart_items
  add column if not exists scent_ids uuid[] not null default '{}';

-- Snapshot of chosen scent name(s) at order time, mirroring how product_name
-- already snapshots the product. Populated for every new order item going
-- forward (single-scent products included), fixing the standing gap where
-- fulfillment had no record of which scent a customer chose.
alter table public.order_items
  add column if not exists scent_names text[] not null default '{}';
