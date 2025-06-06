-- ========================================================
-- BE-6: Club Model & Supabase Table Schema
-- ========================================================
-- This file creates the public.clubs table with proper schema,
-- indexes, and Row Level Security policies.
--
-- Instructions:
-- 1. Open your Supabase dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste the sections below and execute them in order
-- ========================================================

-- ========================================================
-- 1. CREATE CLUBS TABLE
-- ========================================================
-- Creates the public.clubs table to store club data

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  description text,
  logo_url text,
  creator_id uuid references auth.users(id) on delete set null,
  enabled_modules jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ========================================================
-- 2. CREATE INDEXES
-- ========================================================
-- Unique club name per creator (prevents duplicate club names by same user)
create unique index unique_club_name_per_creator
  on public.clubs (creator_id, lower(name));

-- Index for faster lookups by creator
create index idx_clubs_creator_id on public.clubs (creator_id);

-- Index for faster lookups by type
create index idx_clubs_type on public.clubs (type);

-- ========================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ========================================================
alter table public.clubs enable row level security;

-- ========================================================
-- 4. CREATE RLS POLICIES
-- ========================================================

-- Policy: Allow authenticated users to read all clubs (for listing/joining)
create policy "Clubs are publicly readable by authenticated users"
  on public.clubs for select
  to authenticated
  using (true);

-- Policy: Only club creator can insert their own clubs
create policy "Users can create clubs"
  on public.clubs for insert
  to authenticated
  with check (auth.uid() = creator_id);

-- Policy: Only club creator can update their clubs
create policy "Club creators can update their own clubs"
  on public.clubs for update
  to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Policy: Only club creator can delete their clubs
create policy "Club creators can delete their own clubs"
  on public.clubs for delete
  to authenticated
  using (auth.uid() = creator_id);

-- ========================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ========================================================
comment on table public.clubs is 'Stores club information with creator linkage and module configurations';
comment on column public.clubs.id is 'Unique identifier for the club';
comment on column public.clubs.name is 'Name of the club, must be unique per creator';
comment on column public.clubs.type is 'Type/category of club (e.g., sports, scouts, hobby)';
comment on column public.clubs.description is 'Optional description of the club';
comment on column public.clubs.logo_url is 'Optional URL to club logo image';
comment on column public.clubs.creator_id is 'Reference to the user who created the club';
comment on column public.clubs.enabled_modules is 'JSON array of enabled feature modules for the club';
comment on column public.clubs.created_at is 'Timestamp when the club was created';
