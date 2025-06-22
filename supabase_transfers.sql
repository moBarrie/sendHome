-- Create a transfers table for storing user transfers
create table if not exists transfers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  recipient_id uuid references recipients(id) on delete set null,
  amount numeric not null,
  fee numeric not null,
  method text not null, -- 'card' or 'bank'
  status text not null default 'pending',
  created_at timestamp with time zone default timezone('utc', now())
);

-- Enable RLS (Row Level Security)
alter table transfers enable row level security;

-- Policy: Users can only access their own transfers
create policy "Users can view their own transfers" on transfers
  for select using (auth.uid() = user_id);
create policy "Users can insert their own transfers" on transfers
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own transfers" on transfers
  for update using (auth.uid() = user_id);
create policy "Users can delete their own transfers" on transfers
  for delete using (auth.uid() = user_id);
