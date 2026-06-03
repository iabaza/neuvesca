-- Let admins see, edit, and delete every profile (not just their own).
-- The existing per-user policies stay in place; these add OR-branches for admins.

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "profiles_admin_update_all" on public.profiles;
create policy "profiles_admin_update_all"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "profiles_admin_delete_all" on public.profiles;
create policy "profiles_admin_delete_all"
  on public.profiles
  for delete
  to authenticated
  using (public.is_admin());

-- Admins also need column-level grants for role + delete privileges.
grant update (role) on table public.profiles to authenticated;
grant delete on table public.profiles to authenticated;

-- Stop non-admin users from promoting themselves to admin via the
-- profiles_update_own policy (which now also has UPDATE on the role column).
create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.role IS DISTINCT FROM OLD.role and not public.is_admin() then
    raise exception 'Only admins can change a profile role.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
before update on public.profiles
for each row execute function public.guard_profile_role_change();

notify pgrst, 'reload schema';
