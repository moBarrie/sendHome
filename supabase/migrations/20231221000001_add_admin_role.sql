-- Add role column to profiles if it doesn't exist
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'profiles' 
    and column_name = 'role'
  ) then
    alter table profiles add column role text default 'user';
  end if;
end $$;

-- Add constraint to enforce valid roles
alter table profiles
  add constraint role_check
  check (role in ('user', 'admin'));

-- Add index for role lookups
create index if not exists idx_profiles_role on profiles(role);

-- RLS policy update for admin access
create policy "Admins can update other profiles"
on profiles
for all
using (
  (auth.uid() = id) or -- User can manage their own profile
  (exists (
    select 1 from profiles as admin_profile
    where admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'
  ))
);
