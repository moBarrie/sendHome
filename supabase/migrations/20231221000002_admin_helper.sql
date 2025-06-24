-- Add this to supabase/migration-hooks/example.sql
-- Create a function to make a user an admin
create or replace function make_user_admin(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set role = 'admin'
  where id = user_id;
end;
$$;
