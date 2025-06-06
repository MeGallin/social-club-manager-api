-- ========================================================
-- BE-3: Supabase User Profile Schema & Sync
-- ========================================================
-- This file contains all SQL commands that need to be executed
-- in the Supabase SQL Editor to implement the user profile schema
-- and sync functionality.
--
-- Instructions:
-- 1. Open your Supabase dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste each section below and execute them in order
-- ========================================================

-- ========================================================
-- 1. CREATE PROFILES TABLE
-- ========================================================
-- Creates the public.profiles table linked to auth.users
-- This table stores extended user information

create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Enable Row Level Security on the profiles table
alter table public.profiles enable row level security;

-- ========================================================
-- 2. CREATE TRIGGER FUNCTION FOR AUTOMATIC PROFILE CREATION
-- ========================================================
-- This function automatically creates a profile record when a new user signs up

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- ========================================================
-- 3. CREATE TRIGGER TO INVOKE THE FUNCTION
-- ========================================================
-- This trigger calls the handle_new_user function whenever a new user is created

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ========================================================
-- 4. CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
-- These policies ensure users can only access their own profile data

-- Allow users to read their own profile
create policy "Allow individual read access" on public.profiles
for select using (auth.uid() = id);

-- Allow users to insert their own profile
create policy "Allow individual insert access" on public.profiles
for insert with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Allow individual update access" on public.profiles
for update using (auth.uid() = id);

-- ========================================================
-- 5. OPTIONAL: CREATE ADDITIONAL HELPER POLICIES
-- ========================================================
-- These are optional policies for admin access or public read access
-- Uncomment based on your application requirements

-- OPTION A: Allow public read access to profiles (for testing - REMOVE IN PRODUCTION)
-- WARNING: This allows anyone to read all profiles. Use only for testing!
-- create policy "Allow public read access" on public.profiles
-- for select using (true);

-- OPTION B: Allow public full access to profiles (for testing - REMOVE IN PRODUCTION)
-- WARNING: This allows anyone to read/write all profiles. Use only for initial testing!
-- Uncomment these lines temporarily if you need to test without authentication:

-- create policy "Allow public full access" on public.profiles
-- for all using (true);

-- OPTION C: Allow service role to manage all profiles (recommended for backend API)
-- This allows your backend API to manage profiles using the service role key
create policy "Allow service role full access" on public.profiles
for all using (
  auth.jwt() ->> 'role' = 'service_role'
);

-- ========================================================
-- 6. VERIFICATION QUERIES
-- ========================================================
-- Use these queries to verify the setup is working correctly

-- Check if the profiles table was created
-- SELECT table_name, table_schema 
-- FROM information_schema.tables 
-- WHERE table_name = 'profiles' AND table_schema = 'public';

-- Check if RLS is enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'profiles' AND schemaname = 'public';

-- Check if policies were created
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'profiles' AND schemaname = 'public';

-- Check if the trigger function exists
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- Check if the trigger exists
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'on_auth_user_created';

-- ========================================================
-- SETUP COMPLETE
-- ========================================================
-- After executing all the above SQL commands:
-- 1. Test the setup using the Postman collection provided in BE-3.md
-- 2. Verify that new user registrations automatically create profile records
-- 3. Ensure RLS policies are working by testing access controls
-- ========================================================
