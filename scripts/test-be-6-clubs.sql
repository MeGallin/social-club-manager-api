-- ========================================================
-- BE-6: Test Script for Clubs Table
-- ========================================================
-- This script contains test queries to validate the clubs table
-- implementation after running be-6-clubs-schema.sql
--
-- Instructions:
-- 1. Run be-6-clubs-schema.sql first
-- 2. Execute these tests in Supabase SQL Editor
-- 3. Verify expected results
-- ========================================================

-- ========================================================
-- 1. VERIFY TABLE STRUCTURE
-- ========================================================
-- Check if table exists and has correct columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'clubs'
ORDER BY ordinal_position;

-- ========================================================
-- 2. VERIFY INDEXES
-- ========================================================
-- Check if indexes were created correctly
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'clubs' 
  AND schemaname = 'public';

-- ========================================================
-- 3. VERIFY RLS POLICIES
-- ========================================================
-- Check if RLS is enabled and policies exist
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'clubs';

-- ========================================================
-- 4. TEST DATA INSERTION (Sample Club)
-- ========================================================
-- Note: Replace 'your-user-uuid' with actual authenticated user ID
-- This would typically be done via the API, not directly in SQL

-- Example insert (commented out - use API instead):
/*
INSERT INTO public.clubs (
  name, 
  type, 
  description, 
  creator_id, 
  enabled_modules
) VALUES (
  'Test Soccer Club',
  'sports',
  'A test club for validation purposes',
  'your-user-uuid-here',
  '["events", "member_management"]'::jsonb
);
*/

-- ========================================================
-- 5. TEST QUERIES
-- ========================================================
-- Count total clubs
SELECT COUNT(*) as total_clubs FROM public.clubs;

-- Check clubs by type
SELECT type, COUNT(*) as count 
FROM public.clubs 
GROUP BY type 
ORDER BY count DESC;

-- Verify enabled_modules JSON structure
SELECT 
  name,
  enabled_modules,
  jsonb_array_length(enabled_modules) as module_count
FROM public.clubs 
WHERE enabled_modules IS NOT NULL;

-- ========================================================
-- 6. CONSTRAINT TESTS
-- ========================================================
-- Test unique constraint (should fail on duplicate name per creator)
-- This would be tested via API calls with the same creator_id and name

-- Test foreign key constraint
-- This validates the creator_id references auth.users
SELECT 
  c.name,
  c.creator_id,
  u.email
FROM public.clubs c
LEFT JOIN auth.users u ON c.creator_id = u.id
LIMIT 5;

-- ========================================================
-- 7. PERFORMANCE TESTS
-- ========================================================
-- Test index usage (EXPLAIN shows if indexes are used)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.clubs 
WHERE creator_id = 'test-uuid';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.clubs 
WHERE type = 'sports';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.clubs 
WHERE LOWER(name) = 'test soccer club';
