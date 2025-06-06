## [BE-4] User Registration & Login API (Supabase Auth)

### Goal

Implement backend endpoints for user registration and login by integrating with Supabase Auth, ensuring secure authentication, password storage, and returning JWT tokens for future API calls.  
Users must also provide GDPR consent as part of registration.

---

### Acceptance Criteria

- **Registration endpoint** accepts email, password, GDPR consent, and profile data (e.g., full name, avatar).
- **Login endpoint** accepts email and password.
- Successful registration creates a user in Supabase Auth and a profile row in `public.profiles`.
- On successful registration or login, return a JWT access token to the client.
- JWT token can be used to authenticate subsequent API requests.
- Error handling for:
  - Duplicate email on registration
  - Weak or missing password
  - Invalid login credentials
  - Missing GDPR consent
- All endpoints are documented and tested via Postman.

---

### Tasks

1. **Implement Registration Endpoint**

   - **Method:** `POST /api/auth/register`
   - **Input:** `{ email, password, full_name, avatar_url, consent }`
   - Validate required fields and GDPR consent.
   - Use Supabase JS client’s `signUp()` to register user and set profile metadata.
   - On success, return JWT access token and basic user info.
   - On error, return status and message (e.g., email exists).

2. **Implement Login Endpoint**

   - **Method:** `POST /api/auth/login`
   - **Input:** `{ email, password }`
   - Use Supabase JS client’s `signInWithPassword()`.
   - On success, return JWT access token and user info.
   - On error, return status and message.

3. **Error Handling**

   - Return standardized JSON error for missing/invalid fields or failed login.
   - Log errors for debugging.

4. **Document Endpoints**

   - Add to project API documentation (Swagger/OpenAPI or markdown).

5. **Manual Testing in Postman**
   - Confirm registration, login, error scenarios, and token receipt.

---

### How to Test in Postman

#### **Register New User**

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "full_name": "Test User",
    "avatar_url": "https://example.com/avatar.png",
    "consent": true
  }
  ```
