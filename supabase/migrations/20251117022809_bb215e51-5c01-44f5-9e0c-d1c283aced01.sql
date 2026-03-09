-- Create a function to bootstrap the first admin user safely
create or replace function public.bootstrap_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count integer;
begin
  -- Count existing admins
  select count(*) into admin_count from public.user_roles where role = 'admin';

  if admin_count = 0 then
    -- Grant admin to the caller
    insert into public.user_roles (user_id, role)
    values (auth.uid(), 'admin');
    return true; -- granted
  end if;

  return false; -- already exists
end;
$$;

comment on function public.bootstrap_admin() is 'Grants admin role to the caller only if no admin exists yet. Used for first-time setup.';