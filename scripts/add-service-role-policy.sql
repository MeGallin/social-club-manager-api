-- ========================================================
-- ADDITIONAL POLICY FOR BE-3: Service Role Access
-- ========================================================
-- Execute this SQL in your Supabase SQL Editor to allow
-- the backend API to access profiles using the service role key
-- ========================================================

-- Allow service role to manage all profiles (for backend API operations)
create policy "Allow service role full access" on public.profiles
for all using (
  auth.jwt() ->> 'role' = 'service_role'
);

-- ========================================================
-- VERIFICATION QUERY
-- ========================================================
-- Run this to verify the policy was created:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
