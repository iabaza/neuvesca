-- Allow guest orders (no linked profile) so customers can check out without
-- creating an account. The server action uses the service role to insert,
-- so RLS on orders is unaffected — guests still can't read/modify anything
-- via anon auth.

alter table public.orders
  alter column user_id drop not null;

-- Store the customer phone directly on the order so guest orders (no
-- linked profile) still show a way to reach the buyer in the admin.
alter table public.orders
  add column if not exists customer_phone text;

-- Order items don't reference user_id directly; no change needed.
