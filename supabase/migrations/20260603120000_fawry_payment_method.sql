-- Allow 'fawry' as a payment method on orders.
alter table public.orders
  drop constraint if exists orders_payment_method_valid;

alter table public.orders
  add constraint orders_payment_method_valid
  check (payment_method in ('cash_on_delivery', 'stripe', 'fawry'));

-- Optional: store Fawry's merchant reference + reference number so we can
-- look orders up from webhooks / status checks.
alter table public.orders
  add column if not exists fawry_merchant_ref_number text;

alter table public.orders
  add column if not exists fawry_reference_number text;

create index if not exists orders_fawry_merchant_ref_idx
  on public.orders (fawry_merchant_ref_number);
