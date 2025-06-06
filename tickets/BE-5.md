## [BE-5] GDPR/Privacy Consent Handling

### Goal

Ensure all users explicitly provide GDPR/privacy consent at registration.  
Store and enforce consent status in the user profile (`public.profiles`).  
Provide endpoints to view and update consent status.  
Block registration if consent is not provided.

---

### Acceptance Criteria

- GDPR/privacy consent is **required** at registration (cannot register without it).
- Consent status (`consent`: boolean) is stored in the `public.profiles` table.
- Endpoint available to view a user's consent status (`GET /api/profile/consent`).
- Endpoint available to update consent status (`PUT /api/profile/consent`).
- Registration is blocked and an error is returned if consent is not `true`.
- All endpoints are protected and require JWT (user must be authenticated).
- Manual tests in Postman confirm all behaviors.

---

### Tasks

1. **Require Consent at Registration**

   - In `/api/auth/register`, check for a `consent` boolean in the payload.
   - If not present or not `true`, return 400 Bad Request with a clear message.
   - If consent is given, include it in profile data sent to Supabase at signup.
   - Ensure `consent` is written to `public.profiles`.

2. **View Consent Status Endpoint**

   - **Method:** `GET /api/profile/consent`
   - Require JWT (Supabase access token).
   - Look up the authenticated user's row in `public.profiles` and return:
     ```json
     { "consent": true }
     ```

3. **Update Consent Status Endpoint**

   - **Method:** `PUT /api/profile/consent`
   - Require JWT (Supabase access token).
   - Body: `{ "consent": true | false }`
   - Update the user's `consent` field in `public.profiles`.
   - Respond with updated consent status.

4. **Error Handling**

   - Registration endpoint must block users if consent is not provided.
   - Consent update endpoint validates payload and user.

5. **Document Endpoints**

   - Add to API docs and README.

6. **Manual Testing in Postman**
   - Confirm required consent at registration.
   - Confirm viewing and updating consent with a valid JWT.

---

### How to Test in Postman

#### **1. Registration With and Without Consent**

- **URL:** `POST http://localhost:8000/api/auth/register`
- **Body Example (Consent True):**
  ```json
  {
    "email": "consentuser@tws.com",
    "password": "Pass123!",
    "full_name": "Consent User",
    "avatar_url": "",
    "consent": true
  }
  ```
