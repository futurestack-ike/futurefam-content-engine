-- Run this in your Supabase SQL editor to set up the posts table

create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  topic       text not null,
  content     text not null,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security (optional, lock down later)
alter table posts enable row level security;

-- Allow all operations for now (tighten with auth later)
create policy "Allow all" on posts for all using (true) with check (true);
