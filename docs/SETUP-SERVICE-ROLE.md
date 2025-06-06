# Setting Up Service Role Key for BE-3

## Current Issue

The RLS (Row Level Security) policies are blocking API operations because they require either:

1. An authenticated user context (for user-scoped operations)
2. Service role authentication (for backend admin operations)

## Solution Options

### Option 1: Add Service Role Key (Recommended)

1. **Get your Service Role Key:**

   - Go to your Supabase dashboard
   - Navigate to Settings → API
   - Copy the "service_role" key (NOT the anon key)
   - **⚠️ WARNING: Keep this key secret! It has full database access**

2. **Update your .env file:**

   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZ3l5aGdtand0Y2Fjd2FiaGFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIwMzEzMCwiZXhwIjoyMDY0Nzc5MTMwfQ.YOUR_ACTUAL_SERVICE_ROLE_KEY
   ```

3. **Update the database policies:**
   Execute this SQL in Supabase SQL Editor:

   ```sql
   -- Allow service role to manage all profiles (recommended for backend API)
   create policy "Allow service role full access" on public.profiles
   for all using (
     auth.jwt() ->> 'role' = 'service_role'
   );
   ```

4. **Restart your server:**
   ```bash
   npm run dev
   ```

### Option 2: Temporary Public Access (Testing Only)

If you just want to test quickly without setting up the service role:

1. **Execute this SQL in Supabase SQL Editor:**

   ```sql
   -- ⚠️ WARNING: This allows anyone to read/write all profiles
   -- Only use for testing, REMOVE before going to production!
   create policy "Allow public full access" on public.profiles
   for all using (true);
   ```

2. **Test your API endpoints**

3. **REMOVE the public policy after testing:**
   ```sql
   drop policy "Allow public full access" on public.profiles;
   ```

## Why This Happens

Supabase's Row Level Security (RLS) is working correctly. The policies we created:

```sql
-- Allow users to read their own profile
create policy "Allow individual read access" on public.profiles
for select using (auth.uid() = id);
```

This policy requires `auth.uid()` to return a valid user ID, which only happens when:

1. A user is authenticated with a valid JWT token, OR
2. The request is made with the service role key

## Testing After Setup

Once you have the service role key configured, all your API endpoints should work:

- `GET /api/profiles` - List all profiles
- `GET /api/profiles/me` - Get user's own profile
- `POST /api/profiles` - Create new profile
- `PUT /api/profiles/me` - Update user's profile
- `DELETE /api/profiles/:id` - Delete profile

## Security Note

The service role key has **full access** to your database, bypassing all RLS policies. Only use it in:

- Backend server applications (never in frontend/mobile apps)
- Secure server environments
- Administrative operations

Never expose the service role key in:

- Frontend code
- Client-side applications
- Public repositories
- Browser DevTools
