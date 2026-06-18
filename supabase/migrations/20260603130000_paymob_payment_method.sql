-- Allow 'paymob' as a payment method on orders.
alter table public.orders
  drop constraint if exists orders_payment_method_valid;

alter table public.orders
  add constraint orders_payment_method_valid
  check (payment_method in ('cash_on_delivery', 'stripe', 'fawry', 'paymob'));

-- Store Paymob's merchant order id (ours) + the numeric order id (theirs)
-- so webhooks can be reconciled to internal orders.
alter table public.orders
  add column if not exists paymob_merchant_order_id text;

alter table public.orders
  add column if not exists paymob_order_id bigint;

create index if not exists orders_paymob_merchant_order_id_idx
  on public.orders (paymob_merchant_order_id);

create index if not exists orders_paymob_order_id_idx
  on public.orders (paymob_order_id);
