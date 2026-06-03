-- Add product category: candles, bundles, accessories.

alter table public.products
  add column if not exists category text not null default 'candles'
    constraint products_category_valid
    check (category in ('candles', 'bundles', 'accessories'));

create index if not exists products_category_idx on public.products (category);
