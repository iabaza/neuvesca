-- Allow burn_time_hours and size_grams to be NULL so non-candle products
-- (e.g. accessories, oils, bundles) can be created without these fields.

alter table public.products
  alter column burn_time_hours drop not null;

alter table public.products
  alter column size_grams drop not null;

-- Replace the strict ">0" checks with "is null or >0" so empty values are
-- accepted while populated values are still validated.
alter table public.products
  drop constraint if exists products_burn_time_hours_positive;

alter table public.products
  add constraint products_burn_time_hours_positive
  check (burn_time_hours is null or burn_time_hours > 0);

alter table public.products
  drop constraint if exists products_size_grams_positive;

alter table public.products
  add constraint products_size_grams_positive
  check (size_grams is null or size_grams > 0);
