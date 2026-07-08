-- Earlier migrations granted profiles/orders/cart_items privileges only to
-- the `authenticated` role. The `service_role` (used by server-side admin
-- scripts and by auth cascade deletes) was left without table-level grants,
-- causing `permission denied for table profiles` errors and breaking
-- `auth.admin.deleteUser` whenever an auth.users row had a matching profile.

grant select, insert, update, delete on table
  public.products,
  public.scents,
  public.ingredients,
  public.product_scents,
  public.product_ingredients,
  public.profiles,
  public.cart_items,
  public.orders,
  public.order_items,
  public.promo_codes
to service_role;
