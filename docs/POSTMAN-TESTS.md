# BE-3 Postman Testing Guide

## Overview

This guide provides step-by-step instructions for testing the Supabase User Profile Schema & Sync implementation using Postman.

## Prerequisites

- ✅ Supabase project setup complete
- ✅ Database schema executed (profiles table, triggers, RLS policies)
- ✅ Backend API running on `http://localhost:8000`
- ✅ Service role key configured in `.env`

## Test Collection: Social Club Manager - Profiles API

### Test 1: Create User via Supabase Auth

**Purpose:** Create a real user in Supabase Auth system to test automatic profile creation

- **Method:** `POST`
- **URL:** `https://nmgyyhgmjwtcacwabhal.supabase.co/auth/v1/signup`
- **Headers:**
  ```
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZ3l5aGdtand0Y2Fjd2FiaGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDMxMzAsImV4cCI6MjA2NDc3OTEzMH0.yhomWU3VF3_DosVLcnEV54sZzGx07ZIo5F_Olsmz7QE
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "email": "test.user@gmail.com",
    "password": "SecurePassword123!",
    "options": {
      "data": {
        "full_name": "John Test User",
        "avatar_url": "https://via.placeholder.com/150/0000FF/808080?text=JT"
      }
    }
  }
  ```

**Expected Response:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test.user@gmail.com",
    "email_confirmed_at": null,
    "created_at": "2025-06-06T12:35:00.000Z",
    "user_metadata": {
      "full_name": "John Test User",
      "avatar_url": "https://via.placeholder.com/150/0000FF/808080?text=JT"
    }
  },
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

**⚠️ Important:** Save the `user.id` from the response - you'll need it for subsequent tests!

---

### Test 2: Verify Profile Auto-Creation

**Purpose:** Confirm the trigger automatically created a profile

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/profiles`
- **Headers:**
  ```
  Content-Type: application/json
  ```

**Expected Response:**

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Test User",
      "avatar_url": "https://via.placeholder.com/150/0000FF/808080?text=JT",
      "created_at": "2025-06-06T12:35:00.000Z"
    }
  ]
}
```

---

### Test 3: Get Specific Profile by ID

**Purpose:** Test individual profile retrieval

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/profiles/{USER_ID_FROM_STEP_1}`
- **Headers:**
  ```
  Content-Type: application/json
  ```

Replace `{USER_ID_FROM_STEP_1}` with the actual user ID from Test 1.

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "John Test User",
    "avatar_url": "https://via.placeholder.com/150/0000FF/808080?text=JT",
    "created_at": "2025-06-06T12:35:00.000Z"
  }
}
```

---

### Test 4: Update Profile via API

**Purpose:** Test profile updates through backend API

- **Method:** `PUT`
- **URL:** `http://localhost:8000/api/profiles/{USER_ID_FROM_STEP_1}`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "full_name": "John Updated User",
    "avatar_url": "https://via.placeholder.com/150/FF0000/FFFFFF?text=JU"
  }
  ```

**Expected Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "John Updated User",
    "avatar_url": "https://via.placeholder.com/150/FF0000/FFFFFF?text=JU",
    "created_at": "2025-06-06T12:35:00.000Z"
  }
}
```

---

### Test 5: Test "My Profile" Endpoints

**Purpose:** Test user-scoped profile operations (simulating authenticated user)

#### 5A: Get My Profile

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/profiles/me`
- **Headers:**
  ```
  Content-Type: application/json
  x-user-id: {USER_ID_FROM_STEP_1}
  ```

#### 5B: Update My Profile

- **Method:** `PUT`
- **URL:** `http://localhost:8000/api/profiles/me`
- **Headers:**
  ```
  Content-Type: application/json
  x-user-id: {USER_ID_FROM_STEP_1}
  ```
- **Body (raw JSON):**
  ```json
  {
    "full_name": "My Updated Name",
    "avatar_url": "https://via.placeholder.com/150/00FF00/000000?text=ME"
  }
  ```

---

### Test 6: Test Error Scenarios

#### 6A: Profile Not Found

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/profiles/00000000-0000-0000-0000-000000000000`

**Expected Response:**

```json
{
  "success": false,
  "error": "Profile service error: Failed to fetch profile: ...",
  "timestamp": "2025-06-06T12:40:00.000Z",
  "path": "/api/profiles/00000000-0000-0000-0000-000000000000"
}
```

#### 6B: Invalid Profile Creation (Foreign Key Error)

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/profiles`
- **Body:**
  ```json
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "full_name": "Invalid User",
    "avatar_url": "https://example.com/avatar.png"
  }
  ```

**Expected Response:**

```json
{
  "success": false,
  "error": "Profile service error: Failed to create profile: insert or update on table \"profiles\" violates foreign key constraint \"profiles_id_fkey\"",
  "timestamp": "2025-06-06T12:40:00.000Z",
  "path": "/api/profiles"
}
```

This error is **expected behavior** - it proves the foreign key constraint is working!

---

### Test 7: Check Profile Exists

**Purpose:** Test the profile existence check endpoint

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/profiles/{USER_ID_FROM_STEP_1}/exists`

**Expected Response:**

```json
{
  "success": true,
  "exists": true
}
```

---

## Alternative: Using curl Commands

If you prefer command line testing, here are the equivalent curl commands:

### Create User:

```bash
curl -X POST "https://nmgyyhgmjwtcacwabhal.supabase.co/auth/v1/signup" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZ3l5aGdtand0Y2Fjd2FiaGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDMxMzAsImV4cCI6MjA2NDc3OTEzMH0.yhomWU3VF3_DosVLcnEV54sZzGx07ZIo5F_Olsmz7QE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@gmail.com",
    "password": "SecurePassword123!",
    "options": {
      "data": {
        "full_name": "John Test User",
        "avatar_url": "https://via.placeholder.com/150/0000FF/808080?text=JT"
      }
    }
  }'
```

### Get All Profiles:

```bash
curl -X GET "http://localhost:8000/api/profiles"
```

### Get Specific Profile:

```bash
curl -X GET "http://localhost:8000/api/profiles/{USER_ID}"
```

---

## Troubleshooting

### Common Issues:

1. **"Email address invalid" error**: Use a real email domain (gmail.com, outlook.com, etc.)

2. **Foreign key constraint violation**: This is expected when trying to create profiles for non-existent users

3. **RLS policy errors**: Make sure your service role key is correctly set in `.env`

4. **Server not responding**: Ensure the API server is running on port 8000

### Success Indicators:

✅ User creation returns a valid user object with UUID  
✅ Profile auto-creation works (profile appears in GET /api/profiles)  
✅ CRUD operations work without RLS errors  
✅ Foreign key constraints prevent invalid profile creation  
✅ Error handling returns proper JSON responses

---

## Completion Checklist

- [ ] Created user via Supabase Auth
- [ ] Verified automatic profile creation
- [ ] Tested all CRUD operations
- [ ] Confirmed error handling works
- [ ] Validated foreign key constraints
- [ ] Tested user-scoped operations with x-user-id header

**🎉 When all tests pass, your BE-3 implementation is complete!**

---

# BE-5 GDPR/Privacy Consent Tests

This section provides comprehensive testing for the GDPR consent handling features implemented in BE-5.

## Prerequisites for Consent Tests

- ✅ All BE-3 and BE-4 tests completed successfully
- ✅ Consent schema applied to database (`be-5-consent-schema.sql`)
- ✅ Backend API running with consent endpoints
- ✅ Valid JWT token from registration or login

### Test 1: Registration WITHOUT Consent (Should Fail)

**Purpose:** Verify that registration is blocked when consent is not provided

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/register`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "email": "no-consent@tws.com",
    "password": "TestPass123!",
    "full_name": "No Consent User"
  }
  ```

**Expected Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "GDPR consent is required for registration. Consent must be explicitly set to true."
}
```

### Test 2: Registration WITH Consent = false (Should Fail)

**Purpose:** Verify that registration is blocked when consent is explicitly set to false

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/register`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "email": "false-consent@tws.com",
    "password": "TestPass123!",
    "full_name": "False Consent User",
    "consent": false
  }
  ```

**Expected Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "GDPR consent is required for registration. Consent must be explicitly set to true."
}
```

### Test 3: Registration WITH Consent = true (Should Succeed)

**Purpose:** Verify successful registration when consent is explicitly provided

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/register`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "email": "consent-user@tws.com",
    "password": "TestPass123!",
    "full_name": "Consent User",
    "avatar_url": "https://via.placeholder.com/150",
    "consent": true
  }
  ```

**Expected Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "consent-user@tws.com",
      "full_name": "Consent User",
      "created_at": "2025-06-06T12:35:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_here",
    "expires_in": 3600
  }
}
```

**⚠️ IMPORTANT:** Save the `access_token` from this response for subsequent tests!

### Test 4: Get Consent Status (With JWT)

**Purpose:** Verify that authenticated users can view their consent status

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/profile/consent`
- **Headers:**
  ```
  Authorization: Bearer <access_token_from_test_3>
  Content-Type: application/json
  ```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "consent": true
  }
}
```

### Test 5: Get Consent Status (Without JWT - Should Fail)

**Purpose:** Verify that consent endpoints require authentication

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/profile/consent`
- **Headers:**
  ```
  Content-Type: application/json
  ```

**Expected Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": "Access token required"
}
```

### Test 6: Update Consent Status to False

**Purpose:** Verify that users can withdraw consent

- **Method:** `PUT`
- **URL:** `http://localhost:8000/api/profile/consent`
- **Headers:**
  ```
  Authorization: Bearer <access_token_from_test_3>
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "consent": false
  }
  ```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Consent status updated successfully",
  "data": {
    "consent": false
  }
}
```

### Test 7: Update Consent Status to True

**Purpose:** Verify that users can grant consent again

- **Method:** `PUT`
- **URL:** `http://localhost:8000/api/profile/consent`
- **Headers:**
  ```
  Authorization: Bearer <access_token_from_test_3>
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "consent": true
  }
  ```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Consent status updated successfully",
  "data": {
    "consent": true
  }
}
```

### Test 8: Update Consent with Invalid Value (Should Fail)

**Purpose:** Verify proper validation of consent values

- **Method:** `PUT`
- **URL:** `http://localhost:8000/api/profile/consent`
- **Headers:**
  ```
  Authorization: Bearer <access_token_from_test_3>
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "consent": "yes"
  }
  ```

**Expected Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Consent must be a boolean value (true or false)"
}
```

### Test 9: Verify Consent Status After Update

**Purpose:** Confirm that consent updates are persistent

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/profile/consent`
- **Headers:**
  ```
  Authorization: Bearer <access_token_from_test_3>
  Content-Type: application/json
  ```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "consent": true
  }
}
```

## BE-5 Test Results Checklist

After completing all tests, verify:

- [ ] ✅ Registration fails without consent
- [ ] ✅ Registration fails with consent = false
- [ ] ✅ Registration succeeds with consent = true
- [ ] ✅ Consent endpoints require JWT authentication
- [ ] ✅ GET /api/profile/consent returns current status
- [ ] ✅ PUT /api/profile/consent updates consent status
- [ ] ✅ Consent validation rejects non-boolean values
- [ ] ✅ Consent updates are persistent and retrievable

## Error Scenarios to Test

### Invalid JWT Token

Use an expired or malformed token to verify proper error handling:

```json
{
  "success": false,
  "error": "Invalid token"
}
```

### Missing Request Body

Send PUT request without body:

```json
{
  "success": false,
  "error": "Consent must be a boolean value (true or false)"
}
```
