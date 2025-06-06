# BE-4 Authentication API Documentation

## Overview

This document provides comprehensive documentation for the User Registration & Login API endpoints implemented as part of BE-4. The API integrates with Supabase Auth for secure authentication, password storage, and JWT token management.

## Base URL

```
http://localhost:8000/api/auth
```

## Authentication Endpoints

### 1. User Registration

Register a new user with email, password, and optional profile information.

**Endpoint:** `POST /api/auth/register`  
**Access:** Public

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.png",
  "consent": true
}
```

#### Field Validation

- `email` (required): Valid email address format
- `password` (required): Minimum 8 characters
- `full_name` (optional): User's full name for profile
- `avatar_url` (optional): URL to user's profile picture
- `consent` (required): Must be `true` for GDPR compliance

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "full_name": "John Doe",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here",
    "expires_in": 3600
  }
}
```

#### Error Responses

**400 Bad Request - Missing Required Fields**

```json
{
  "success": false,
  "error": "Email and password are required"
}
```

**400 Bad Request - Missing GDPR Consent**

```json
{
  "success": false,
  "error": "GDPR consent is required for registration"
}
```

**400 Bad Request - Invalid Email**

```json
{
  "success": false,
  "error": "Please provide a valid email address"
}
```

**400 Bad Request - Weak Password**

```json
{
  "success": false,
  "error": "Password must be at least 8 characters long"
}
```

**409 Conflict - Email Already Exists**

```json
{
  "success": false,
  "error": "A user with this email already exists"
}
```

---

### 2. User Login

Authenticate user with email and password.

**Endpoint:** `POST /api/auth/login`  
**Access:** Public

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Field Validation

- `email` (required): Valid email address format
- `password` (required): User's password

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "full_name": "John Doe",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here",
    "expires_in": 3600
  }
}
```

#### Error Responses

**400 Bad Request - Missing Credentials**

```json
{
  "success": false,
  "error": "Email and password are required"
}
```

**400 Bad Request - Invalid Email Format**

```json
{
  "success": false,
  "error": "Please provide a valid email address"
}
```

**401 Unauthorized - Invalid Credentials**

```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**401 Unauthorized - Email Not Confirmed**

```json
{
  "success": false,
  "error": "Please confirm your email before logging in"
}
```

---

### 3. User Logout

Logout the current user and invalidate session.

**Endpoint:** `POST /api/auth/logout`  
**Access:** Private

#### Request Headers

```
Content-Type: application/json
Authorization: Bearer <access_token>
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Logout failed"
}
```

---

### 4. Refresh Session

Refresh the user's access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`  
**Access:** Public

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
  "refresh_token": "refresh-token-here"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Session refreshed successfully",
  "data": {
    "access_token": "new-jwt-token-here",
    "refresh_token": "new-refresh-token-here",
    "expires_in": 3600,
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "full_name": "John Doe"
    }
  }
}
```

#### Error Responses

**400 Bad Request - Missing Refresh Token**

```json
{
  "success": false,
  "error": "Refresh token is required"
}
```

**401 Unauthorized - Invalid Refresh Token**

```json
{
  "success": false,
  "error": "Session refresh failed"
}
```

---

### 5. Verify Token

Verify if the provided JWT token is valid.

**Endpoint:** `GET /api/auth/verify`  
**Access:** Private

#### Request Headers

```
Authorization: Bearer <access_token>
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "full_name": "John Doe"
    }
  }
}
```

#### Error Responses

**401 Unauthorized - Missing Token**

```json
{
  "success": false,
  "error": "Access token is required"
}
```

**401 Unauthorized - Invalid Token**

```json
{
  "success": false,
  "error": "Invalid token"
}
```

---

### 6. Get Current User

Get current authenticated user's information.

**Endpoint:** `GET /api/auth/me`  
**Access:** Private

#### Request Headers

```
Authorization: Bearer <access_token>
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.png",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Error Responses

**401 Unauthorized - Missing Token**

```json
{
  "success": false,
  "error": "Access token is required"
}
```

**401 Unauthorized - Invalid Token**

```json
{
  "success": false,
  "error": "Failed to get user info"
}
```

---

## Authentication Flow

### Registration Flow

1. User submits registration form with email, password, and consent
2. API validates input and GDPR consent
3. Supabase creates user in auth.users table
4. Trigger automatically creates profile in public.profiles table
5. API returns JWT tokens for immediate login

### Login Flow

1. User submits credentials
2. API validates with Supabase Auth
3. Returns JWT tokens on successful authentication

### Protected Route Access

1. Client includes JWT token in Authorization header: `Bearer <token>`
2. Server verifies token with Supabase
3. Request proceeds if token is valid

### Token Refresh

1. When access token expires, client uses refresh token
2. API returns new access and refresh tokens
3. Client updates stored tokens

---

## Integration with Profiles

The authentication system is integrated with the existing profiles system:

- Registration automatically creates a profile record
- Profile endpoints support both JWT and x-user-id header (backward compatibility)
- User metadata (full_name, avatar_url) is stored in Supabase and synced to profiles table

---

## Security Features

- **Password Validation**: Minimum 8 characters required
- **Email Validation**: Valid email format required
- **GDPR Compliance**: Explicit consent required for registration
- **JWT Security**: Tokens are issued by Supabase with configurable expiration
- **Error Handling**: Standardized error responses without sensitive information exposure

---

## Development Notes

### Mock Mode

When Supabase is not configured, the API operates in mock mode:

- Returns sample tokens and user data
- Allows testing without full Supabase setup
- Mock credentials: `test@example.com` / `TestPass123!`

### Backward Compatibility

Profile routes continue to support `x-user-id` header for testing while also supporting JWT authentication.

---

## Environment Variables

Required environment variables for full functionality:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## Testing

See the Postman testing guide in the next section for comprehensive testing instructions.
