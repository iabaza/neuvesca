-- Tracks whether the "order placed" email/WhatsApp has been sent for an order.
-- Payment providers retry webhooks, so notifications are claimed atomically via
--   update orders set notified_at = now() where id = $1 and notified_at is null
-- and only the caller that wins the update actually sends anything.
alter table public.orders
  add column if not exists notified_at timestamptz;
