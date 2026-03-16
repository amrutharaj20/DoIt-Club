-- StreakSquad — Supabase SQL Setup
-- Run this entire file in your Supabase SQL Editor (supabase.com → SQL Editor → New query)

-- 1. PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. HABITS
create table public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  streak integer default 0,
  total_done integer default 0,
  assigned_by text default null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. COMPLETIONS (one row per habit per day)
create table public.completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  habit_id uuid references public.habits on delete cascade not null,
  completed_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, habit_id, completed_date)
);

-- 4. FRIENDSHIPS
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  friend_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, friend_id)
);

-- 5. CHEERS
create table public.cheers (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references public.profiles on delete cascade not null,
  to_user_id uuid references public.profiles on delete cascade not null,
  habit_id uuid references public.habits on delete cascade not null,
  cheer_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(from_user_id, to_user_id, habit_id, cheer_date)
);

-- 6. ROW LEVEL SECURITY (RLS) — keeps data private per user
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.completions enable row level security;
alter table public.friendships enable row level security;
alter table public.cheers enable row level security;

-- Profiles: users can read all profiles (for friend search), only edit their own
create policy "Public profiles are viewable" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Habits: users can read habits of friends + their own
create policy "Users can view own habits" on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on public.habits for delete using (auth.uid() = user_id);

-- Allow inserting habits for friends (for assign feature)
create policy "Users can assign habits to friends" on public.habits for insert with check (true);

-- Completions
create policy "Users can view own completions" on public.completions for select using (auth.uid() = user_id);
create policy "Users can insert own completions" on public.completions for insert with check (auth.uid() = user_id);
create policy "Users can delete own completions" on public.completions for delete using (auth.uid() = user_id);

-- Friendships
create policy "Users can view own friendships" on public.friendships for select using (auth.uid() = user_id);
create policy "Users can insert own friendships" on public.friendships for insert with check (auth.uid() = user_id);
create policy "Users can delete own friendships" on public.friendships for delete using (auth.uid() = user_id);

-- Cheers
create policy "Users can view cheers" on public.cheers for select using (true);
create policy "Users can insert cheers" on public.cheers for insert with check (auth.uid() = from_user_id);

-- 7. REALTIME — enable realtime on these tables
-- Go to Supabase Dashboard → Database → Replication → enable for: habits, completions, cheers
