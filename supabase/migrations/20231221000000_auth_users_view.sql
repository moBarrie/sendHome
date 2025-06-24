-- Create a view to safely expose auth.users email for admin purposes
create or replace view auth_users_view as
select
  id,
  email,
  role
from auth.users;

-- Grant access to authenticated users (but RLS will restrict access)
grant select on auth_users_view to authenticated;

-- RLS policy to only allow admins to view all users
create policy "Allow admins to view all users"
on auth_users_view
for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
