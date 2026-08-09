-- Per-product discount, set from the admin dashboard. 0 means no discount.
-- The discounted price is derived at read time rather than stored, so the
-- original price stays intact and the sale can be turned off by setting this
-- back to 0.
alter table public.products
  add column if not exists discount_percent integer not null default 0;

alter table public.products
  drop constraint if exists products_discount_percent_valid;

alter table public.products
  add constraint products_discount_percent_valid
  check (discount_percent >= 0 and discount_percent <= 100);
