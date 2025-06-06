# BE-3 Implementation Guide: Supabase User Profile Schema & Sync

This document provides step-by-step instructions for implementing and testing the Supabase user profile schema and sync functionality.

## Overview

The BE-3 implementation includes:

- Supabase database schema setup (profiles table, triggers, RLS policies)
- Node.js backend integration with Supabase
- API endpoints for profile management
- Testing instructions

## Prerequisites

1. **Supabase Project**: You need an active Supabase project
2. **Node.js**: Version 16 or higher
3. **Environment Setup**: Supabase credentials configured

## 🚀 Setup Instructions

### Step 1: Supabase Project Setup

1. **Create a Supabase Project** (if you haven't already):

   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Configure Environment Variables**:
   Update your `.env` file with your Supabase credentials:

   ```env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   **⚠️ IMPORTANT:** You need the service role key for backend API operations to work properly.

   **To get your service role key:**

   - Go to your Supabase dashboard
   - Navigate to Settings → API
   - Copy the "service_role" key (the long JWT token)
   - **Keep this key secret** - it has full database access!

### Step 2: Database Schema Setup

1. **Open Supabase SQL Editor**:

   - Go to your Supabase dashboard
   - Navigate to SQL Editor

2. **Execute Setup SQL**:

   - Copy the contents of `api/scripts/supabase-setup.sql`
   - Paste into the SQL Editor
   - Execute the script (this will create tables, triggers, and policies)

3. **Enable Service Role Policy**:
   The setup script includes a service role policy that allows your backend API to manage profiles.
   This policy is already included in the script and will be created automatically.

### Step 3: Backend Integration

The backend integration is already complete with the following components:

- **Supabase Client Configuration**: `src/config/supabase.js`
- **Profile Service**: `src/services/profileService.js`
- **Profile Controller**: `src/controllers/profileController.js`
- **Profile Routes**: `src/routes/profiles.js`

### Step 4: Install Dependencies

```bash
cd api
npm install
```

The Supabase client is already added to package.json: `@supabase/supabase-js`

### Step 5: Start the Server

```bash
npm run dev
```

Server should be running on `http://localhost:8000`

## 🧪 Testing with Postman

### Collection Setup

Create a new Postman collection called "Social Club Manager - Profiles API" with the following requests:

---

### 1. Test Supabase User Registration

**Purpose**: Test the automatic profile creation trigger

- **Method**: `POST`
- **URL**: `https://your-project-ref.supabase.co/auth/v1/signup`
- **Headers**:
  ```
  apikey: your_supabase_anon_key
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "email": "testuser@example.com",
    "password": "securePassword123",
    "options": {
      "data": {
        "full_name": "Test User",
        "avatar_url": "https://example.com/avatar.png"
      }
    }
  }
  ```

**Expected Response**:

```json
{
  "user": {
    "id": "uuid-here",
    "email": "testuser@example.com",
    ...
  },
  "session": {
    "access_token": "jwt-token-here",
    ...
  }
}
```

**Note**: Save the `user.id` and `access_token` for subsequent tests.

---

### 2. Verify Profile Auto-Creation

**Purpose**: Confirm the trigger created a profile automatically

- **Method**: `GET`
- **URL**: `https://your-project-ref.supabase.co/rest/v1/profiles?id=eq.{user-id}`
- **Headers**:
  ```
  apikey: your_supabase_anon_key
  Authorization: Bearer {access_token}
  Content-Type: application/json
  ```

**Expected Response**:

```json
[
  {
    "id": "uuid-here",
    "full_name": "Test User",
    "avatar_url": "https://example.com/avatar.png",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### 3. Test Backend API - Get Profile

**Purpose**: Test our Node.js API profile retrieval

- **Method**: `GET`
- **URL**: `http://localhost:8000/api/profiles/me`
- **Headers**:
  ```
  x-user-id: {user-id-from-signup}
  Content-Type: application/json
  ```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "full_name": "Test User",
    "avatar_url": "https://example.com/avatar.png",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Test Backend API - Update Profile

**Purpose**: Test profile updates through our API

- **Method**: `PUT`
- **URL**: `http://localhost:8000/api/profiles/me`
- **Headers**:
  ```
  x-user-id: {user-id-from-signup}
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "full_name": "Updated Test User",
    "avatar_url": "https://example.com/new-avatar.png"
  }
  ```

**Expected Response**:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid-here",
    "full_name": "Updated Test User",
    "avatar_url": "https://example.com/new-avatar.png",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 5. Test Backend API - Get All Profiles

**Purpose**: Test admin-level profile listing

- **Method**: `GET`
- **URL**: `http://localhost:8000/api/profiles`
- **Headers**:
  ```
  Content-Type: application/json
  ```

**Expected Response**:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "uuid-here",
      "full_name": "Updated Test User",
      "avatar_url": "https://example.com/new-avatar.png",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 6. Test RLS Security - Unauthorized Access

**Purpose**: Verify Row Level Security is working

- **Method**: `GET`
- **URL**: `https://your-project-ref.supabase.co/rest/v1/profiles`
- **Headers**:
  ```
  apikey: your_supabase_anon_key
  Content-Type: application/json
  ```
  (Note: No Authorization header)

**Expected Response**: Should return empty array or error due to RLS policies.

---

### 7. Test Profile Creation (Manual)

**Purpose**: Test manual profile creation via API

- **Method**: `POST`
- **URL**: `http://localhost:8000/api/profiles`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "Manual User",
    "avatar_url": "https://example.com/manual-avatar.png"
  }
  ```

**Expected Response**:

```json
{
  "success": true,
  "message": "Profile created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "Manual User",
    "avatar_url": "https://example.com/manual-avatar.png",
    "created_at": "2024-01-15T10:35:00.000Z"
  }
}
```

---

## 🔍 Additional Testing

### Error Scenarios to Test

1. **Invalid User ID**:

   - Use non-existent UUID in profile requests
   - Should return appropriate error messages

2. **Missing Required Fields**:

   - Try updating profile with empty body
   - Should return validation errors

3. **Duplicate Profile Creation**:
   - Try creating profile for existing user ID
   - Should return conflict error

### Database Verification

You can also test directly in Supabase:

1. **Check Profiles Table**:

   ```sql
   SELECT * FROM public.profiles;
   ```

2. **Verify Trigger Function**:

   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name = 'handle_new_user';
   ```

3. **Check RLS Policies**:
   ```sql
   SELECT policyname, cmd FROM pg_policies
   WHERE tablename = 'profiles';
   ```

## ✅ Completion Checklist

- [ ] Supabase project created and configured
- [ ] Environment variables set up
- [ ] Database schema executed (tables, triggers, policies)
- [ ] Backend API running successfully
- [ ] User registration creates profile automatically
- [ ] Profile CRUD operations working via API
- [ ] RLS policies enforcing access control
- [ ] All Postman tests passing
- [ ] Error handling tested and working

## 🚨 Troubleshooting

### Common Issues

1. **RLS Policy Errors (Row Level Security)**:

   ```
   Error: new row violates row-level security policy
   ```

   **Solution**: Make sure you have added your service role key to the `.env` file:

   - Get service role key from Supabase Dashboard → Settings → API
   - Add to `.env`: `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`
   - Restart the server: `npm run dev`

2. **Supabase Connection Errors**:

   - Verify SUPABASE_URL and SUPABASE_ANON_KEY in .env
   - Check Supabase project is active

3. **Profile Not Auto-Created**:

   - Verify trigger was created successfully
   - Check user registration includes metadata

4. **API Errors**:
   - Check server logs for detailed error messages
   - Verify all dependencies are installed

### Quick Test for RLS Issues

If you're still getting RLS errors after adding the service role key, you can temporarily test with public access:

1. **Add temporary public policy** (in Supabase SQL Editor):

   ```sql
   -- ⚠️ WARNING: Remove this after testing!
   create policy "temp_public_access" on public.profiles
   for all using (true);
   ```

2. **Test your API endpoints**

3. **Remove the temporary policy**:

   ```sql
   drop policy "temp_public_access" on public.profiles;
   ```

4. **Make sure service role is properly configured for production use**

### Support

If you encounter issues:

1. Check the server logs in terminal
2. Review Supabase logs in dashboard
3. Verify all SQL scripts executed successfully
4. Ensure environment variables are correctly set

---

**Implementation Status**: ✅ Complete

The BE-3 ticket implementation is now complete with full Supabase integration, automatic profile creation, RLS security, and a comprehensive API for profile management.
