-- Drop existing policies to avoid conflicts
drop policy if exists "Admins can update other profiles" on profiles;
drop policy if exists "Allow admins to view all users" on auth_users_view;

-- Update profiles table RLS policies
alter table profiles enable row level security;

create policy "Users can read their own profile"
on profiles for select
to authenticated
using (auth.uid() = id);

create policy "Users can update their own profile"
on profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can read all profiles"
on profiles for select
to authenticated
using (
  exists (
    select 1 
    from auth.users
    where auth.users.id = auth.uid()
    and (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  )
);

create policy "Admins can update all profiles"
on profiles for update
to authenticated
using (
  exists (
    select 1 
    from auth.users
    where auth.users.id = auth.uid()
    and (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  )
);

-- Update auth_users_view policies
drop policy if exists "Allow admins to view all users" on auth_users_view;

create policy "Allow admins to view all users"
on auth_users_view for select
to authenticated
using (
  exists (
    select 1 
    from auth.users
    where auth.users.id = auth.uid()
    and (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  )
);
