-- Create a recipients table for storing user recipients
create table if not exists recipients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  country text not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Enable RLS (Row Level Security)
alter table recipients enable row level security;

-- Policy: Users can only access their own recipients
create policy "Users can view their own recipients" on recipients
  for select using (auth.uid() = user_id);
create policy "Users can insert their own recipients" on recipients
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own recipients" on recipients
  for update using (auth.uid() = user_id);
create policy "Users can delete their own recipients" on recipients
  for delete using (auth.uid() = user_id);
