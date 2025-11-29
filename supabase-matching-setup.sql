-- ============================================
-- MATCHING SYSTEM - DATABASE SETUP
-- ============================================

-- 1. Create swipes table
-- Tracks all like/pass actions
create table swipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  target_user_id uuid references auth.users not null,
  action text not null check (action in ('like', 'pass')),
  created_at timestamp with time zone default now(),
  unique(user_id, target_user_id)
);

-- Enable RLS
alter table swipes enable row level security;

-- Users can view their own swipes
create policy "Users can view own swipes"
  on swipes for select
  using (auth.uid() = user_id);

-- Users can create swipes
create policy "Users can create swipes"
  on swipes for insert
  with check (auth.uid() = user_id);

-- Indexes for performance
create index swipes_user_id_idx on swipes(user_id);
create index swipes_target_user_id_idx on swipes(target_user_id);


-- 2. Create matches table
-- Stores mutual matches (both users liked each other)
create table matches (
  id uuid primary key default uuid_generate_v4(),
  user1_id uuid references auth.users not null,
  user2_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  check (user1_id < user2_id), -- Ensure consistent ordering
  unique(user1_id, user2_id)
);

-- Enable RLS
alter table matches enable row level security;

-- Users can view matches they're part of
create policy "Users can view own matches"
  on matches for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Indexes for performance
create index matches_user1_id_idx on matches(user1_id);
create index matches_user2_id_idx on matches(user2_id);
