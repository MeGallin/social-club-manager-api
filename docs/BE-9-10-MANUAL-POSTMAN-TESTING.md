# BE-9-10 Club Invitations - Manual Postman Testing Guide

## Overview

This guide walks you through manually testing the club invitation functionality using Postman. All endpoints have been implemented and the database schema is ready.

## Prerequisites

1. **API Server Running**: Ensure the API server is running on `http://localhost:8000`
2. **Postman**: Have Postman installed and ready
3. **Test Users**: You'll need to create test users during the process

## Test Users Setup

### Required Test Users

You'll need 3 test users with different roles:

1. **Club Admin** - `testadmin@tws.com` / `testpass123`
2. **Club Member** - `testmember@tws.com` / `testpass123`
3. **Invitee User** - `testinvitee@tws.com` / `testpass123`

## Postman Environment Setup

### 1. Create Environment Variables

In Postman, create a new environment with these variables:

- `base_url`: `http://localhost:8000/api`
- `admin_token`: (will be set during auth)
- `member_token`: (will be set during auth)
- `invitee_token`: (will be set during auth)
- `test_club_id`: (will be set when creating club)
- `invitation_id`: (will be set during invitation)
- `invite_code`: (will be set during code generation)

## Step-by-Step Testing Process

---

## Phase 1: Authentication & Setup

### Step 1: Register Test Users

**Request 1.1: Register Admin User**

```
POST {{base_url}}/auth/register
Content-Type: application/json

{
  "email": "testadmin@tws.com",
  "password": "testpass123",
  "full_name": "Test Admin",
  "consent": true
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "testadmin@example.com",
      "full_name": "Test Admin",
      "created_at": "2025-06-07T..."
    },
    "access_token": "eyJ...",
    "refresh_token": "refresh_token_here",
    "expires_in": 3600
  }
}
```

**Action:** Copy the `access_token` and set it as `admin_token` in your environment.

**Request 1.2: Register Member User**

```
POST {{base_url}}/auth/register
Content-Type: application/json

{
  "email": "testmember@tws.com",
  "password": "testpass123",
  "full_name": "Test Member",
  "consent": true
}
```

**Action:** Copy the `access_token` and set it as `member_token` in your environment.

**Request 1.3: Register Invitee User**

```
POST {{base_url}}/auth/register
Content-Type: application/json

{
  "email": "testinvitee@tws.com",
  "password": "testpass123",
  "full_name": "Test Invitee",
  "consent": true
}
```

**Action:** Copy the `access_token` and set it as `invitee_token` in your environment.

### Step 2: Create Test Club

**Request 2.1: Create Club (as Admin)**

```
POST {{base_url}}/clubs
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Invitation Test Club",
  "type": "sports",
  "description": "A club for testing invitation functionality"
}
```

**Expected Response:**

```json
{
  "message": "Club created successfully",
  "data": {
    "id": "uuid-here",
    "name": "Invitation Test Club",
    ...
  }
}
```

**Action:** Copy the club `id` and set it as `test_club_id` in your environment.

---

## Phase 2: Email Invitation Testing

### Step 3: Email Invitation Flow

**Request 3.1: Send Email Invitation (Admin)**

```
POST {{base_url}}/clubs/{{test_club_id}}/invite-email
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "email": "testinvitee@example.com",
  "role": "member"
}
```

**Expected Response:**

```json
{
  "message": "Invitation sent successfully",
  "data": {
    "id": "invitation-uuid",
    "email": "testinvitee@example.com",
    "role": "member",
    "status": "pending",
    ...
  }
}
```

**Action:** Copy the invitation `id` and set it as `invitation_id` in your environment.

**Request 3.2: Try Duplicate Invitation (Should Fail)**

```
POST {{base_url}}/clubs/{{test_club_id}}/invite-email
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "email": "testinvitee@example.com",
  "role": "member"
}
```

**Expected Response:**

- Status: `400 Bad Request`
- Message: Contains "already been sent" or similar

**Request 3.3: Non-Admin Invitation (Should Fail)**

```
POST {{base_url}}/clubs/{{test_club_id}}/invite-email
Authorization: Bearer {{member_token}}
Content-Type: application/json

{
  "email": "another@example.com",
  "role": "member"
}
```

**Expected Response:**

- Status: `403 Forbidden`
- Message: Contains "admin" or "permission" error

### Step 4: View Invitations

**Request 4.1: Get Club Invitations (Admin Only)**

```
GET {{base_url}}/clubs/{{test_club_id}}/invitations
Authorization: Bearer {{admin_token}}
```

**Expected Response:**

```json
{
  "message": "Invitations retrieved successfully",
  "data": [
    {
      "id": "invitation-uuid",
      "email": "testinvitee@example.com",
      "role": "member",
      "status": "pending",
      ...
    }
  ]
}
```

**Request 4.2: Get User's Pending Invitations**

```
GET {{base_url}}/clubs/my-invitations
Authorization: Bearer {{invitee_token}}
```

**Expected Response:**

```json
{
  "message": "User invitations retrieved successfully",
  "data": [
    {
      "id": "invitation-uuid",
      "club": {
        "id": "club-uuid",
        "name": "Invitation Test Club",
        ...
      },
      "role": "member",
      "status": "pending",
      ...
    }
  ]
}
```

### Step 5: Accept Email Invitation

**Request 5.1: Accept Invitation**

```
POST {{base_url}}/clubs/{{test_club_id}}/accept-invitation
Authorization: Bearer {{invitee_token}}
```

**Expected Response:**

```json
{
  "message": "Invitation accepted successfully",
  "data": {
    "club_id": "club-uuid",
    "user_id": "user-uuid",
    "role": "member",
    "status": "active",
    ...
  }
}
```

**Request 5.2: Verify Membership**

```
GET {{base_url}}/clubs/{{test_club_id}}/members
Authorization: Bearer {{admin_token}}
```

**Expected Response:** Should show the invitee as a member.

---

## Phase 3: Invite Code Testing

### Step 6: Generate Invite Code

**Request 6.1: Generate Invite Code (Admin)**

```
POST {{base_url}}/clubs/{{test_club_id}}/invite-code
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "role": "admin"
}
```

**Expected Response:**

```json
{
  "message": "Invite code generated successfully",
  "data": {
    "invite_code": "vhTEY6NSMVCX_wRkoFTwpg",
    "club_id": "club-uuid",
    "role": "admin",
    "expires_at": "2025-06-13T...",
    ...
  }
}
```

**Action:** Copy the `invite_code` and set it as `invite_code` in your environment.

### Step 7: Use Invite Code

**Request 7.1: Join Club via Invite Code**

```
POST {{base_url}}/clubs/join/{{invite_code}}
Authorization: Bearer {{member_token}}
```

**Expected Response:**

```json
{
  "message": "Successfully joined club via invite code",
  "data": {
    "club_id": "club-uuid",
    "user_id": "user-uuid",
    "role": "admin",
    "status": "active",
    ...
  }
}
```

**Request 7.2: Try Same Code Again (Should Fail)**

```
POST {{base_url}}/clubs/join/{{invite_code}}
Authorization: Bearer {{admin_token}}
```

**Expected Response:**

- Status: `400 Bad Request` or `404 Not Found`
- Message: "Invalid or expired invite code"

---

## Phase 4: Invitation Management

### Step 8: Cancel Invitation

**Request 8.1: Create New Invitation to Cancel**

```
POST {{base_url}}/clubs/{{test_club_id}}/invite-email
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "email": "cancel@example.com",
  "role": "member"
}
```

**Action:** Copy the new invitation `id` for the next request.

**Request 8.2: Cancel Invitation**

```
DELETE {{base_url}}/clubs/invitations/{{invitation_id}}
Authorization: Bearer {{admin_token}}
```

**Expected Response:**

```json
{
  "message": "Invitation cancelled successfully"
}
```

**Request 8.3: Verify Cancellation**

```
GET {{base_url}}/clubs/{{test_club_id}}/invitations
Authorization: Bearer {{admin_token}}
```

**Expected Response:** The cancelled invitation should not appear in the list.

---

## Phase 5: Error Cases & Edge Cases

### Step 9: Permission Testing

**Request 9.1: Non-Admin Generate Code (Should Fail)**

```
POST {{base_url}}/clubs/{{test_club_id}}/invite-code
Authorization: Bearer {{member_token}}
Content-Type: application/json

{
  "role": "member"
}
```

**Expected Response:** Permission denied error.

**Request 9.2: Invalid Club ID**

```
POST {{base_url}}/clubs/00000000-0000-0000-0000-000000000000/invite-email
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "email": "test@example.com",
  "role": "member"
}
```

**Expected Response:** Club not found error.

**Request 9.3: Invalid Email Format**

```
POST {{base_url}}/clubs/{{test_club_id}}/invite-email
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "email": "invalid-email",
  "role": "member"
}
```

**Expected Response:** Validation error.

**Request 9.4: Invalid Role**

```
POST {{base_url}}/clubs/{{test_club_id}}/invite-email
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "email": "test@example.com",
  "role": "invalid_role"
}
```

**Expected Response:** Invalid role error.

---

## Test Results Checklist

### ✅ Email Invitations

- [ ] Admin can send email invitations
- [ ] Duplicate invitations are prevented
- [ ] Non-admins cannot send invitations
- [ ] Invitations appear in club and user lists
- [ ] Users can accept invitations successfully
- [ ] Accepted users become club members

### ✅ Invite Codes

- [ ] Admin can generate invite codes
- [ ] Generated codes are valid and formatted correctly
- [ ] Users can join clubs via invite codes
- [ ] Invite codes are single-use (cannot be reused)
- [ ] Non-admins cannot generate invite codes

### ✅ Invitation Management

- [ ] Admin can view all club invitations
- [ ] Users can view their pending invitations
- [ ] Admin can cancel pending invitations
- [ ] Cancelled invitations are removed from lists

### ✅ Security & Permissions

- [ ] Proper authentication required for all endpoints
- [ ] Admin permissions enforced correctly
- [ ] Input validation works (email format, roles, etc.)
- [ ] Error handling provides appropriate messages

### ✅ Edge Cases

- [ ] Invalid club IDs handled properly
- [ ] Invalid invitation IDs handled properly
- [ ] Invalid/expired invite codes handled properly
- [ ] Malformed requests return validation errors

---

## Troubleshooting

### Common Issues

**Issue: "Please confirm your email before logging in"**

- **Cause**: Your Supabase project has email confirmation enabled
- **Solutions**:
  1. **Quick Fix - Disable Email Confirmation:**
     - Go to Supabase Dashboard → Authentication → Settings
     - Turn OFF "Enable email confirmations"
     - Save settings and try login again
  2. **Use Helper Script to Confirm Emails:**
     ```bash
     node scripts/confirm-test-emails.js
     ```
  3. **Use Auto-Registration Script:**
     ```bash
     node scripts/register-test-users.js
     ```
     This script registers users AND confirms their emails automatically.

**Issue: "User already registered" during signup**

- **Solution**: Use the login endpoint instead:

```
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "email": "testadmin@tws.com",
  "password": "testpass123"
}
```

**Issue: "GDPR consent is required for registration"**

- **Solution**: The registration endpoint requires `consent: true` field. All registration requests in this guide include the required consent field.

**Issue: Wrong endpoint for registration**

- **Note**: The correct endpoint is `/auth/register` not `/auth/signup`. All examples in this guide use the correct endpoint.

**Issue: "Invalid token" errors**

- **Solution**: Check that tokens are properly set in environment variables and not expired

**Issue: "Club not found" errors**

- **Solution**: Verify the `test_club_id` environment variable is set correctly

**Issue: Database connection errors**

- **Solution**: Ensure the API server is running and Supabase is configured properly

### API Health Check

Before starting tests, verify the API is running:

```
GET {{base_url}}/health
```

Expected response: `{ "status": "OK", "timestamp": "..." }`

---

## Summary

This manual testing approach validates all 7 key invitation scenarios:

1. **Email Invitation Flow** - Send, view, accept email invitations
2. **Invite Code Flow** - Generate, use, validate single-use codes
3. **Permission Controls** - Admin-only actions properly restricted
4. **Duplicate Prevention** - Cannot send duplicate invitations
5. **Invitation Management** - View and cancel pending invitations
6. **Security Validation** - Proper authentication and input validation
7. **Error Handling** - Appropriate error responses for edge cases

Each test provides clear expected responses so you can verify the functionality is working correctly.
