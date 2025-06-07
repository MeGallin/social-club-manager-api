## [BE-3, BE-4, BE-5, BE-9, BE-10, BE-11] Member/Parent Invitation & Joining Workflow

### Goal

Enable a seamless and secure member/parent onboarding flow:

- Allow users to join a club via a unique invite link or code.
- Capture full profile and consent.
- Assign correct role within the club.
- Upon success, user is linked to the club and sees the dashboard with their club data.

---

### Acceptance Criteria

- Users can join a club via a secure invite email or code ([BE-10]).
- Users can sign up or log in, and must provide required profile data ([BE-3], [BE-4]).
- GDPR/privacy consent is mandatory ([BE-5]).
- Profile (with parent/child info if relevant) is created/updated ([BE-3], [BE-9]).
- On successful joining, user is linked to club as a member or specified role ([BE-11]).
- The user’s club dashboard is populated with current data ([BE-7], [BE-8]).
- All flows validated via Postman.

---

### Tasks

1. **Invite Flow**

   - Send invite via email (unique link) or generate single-use join code ([BE-10]).
   - Store pending invite in `club_members` with status and target email/code.

2. **Sign Up or Log In**

   - If invite not yet registered: User completes registration via `/api/auth/register` ([BE-4]).
   - If already registered: User logs in via `/api/auth/login` ([BE-4]).
   - Collects required profile info (name, contact, [child info for parents]) ([BE-3], [BE-9]).

3. **Consent Handling**

   - Registration endpoint requires and verifies GDPR/privacy consent ([BE-5]).

4. **Profile Creation/Update**

   - On registration or login, update the `profiles` table with full profile info ([BE-3], [BE-9]).
   - Link Supabase user ID to invite record.

5. **Accept Invite / Join Club**

   - User posts invite code to `/api/invites/accept` ([BE-10]).
   - API verifies code, assigns user to club, sets role (default: member, or specified in invite) ([BE-11]).
   - Status in `club_members` updates to 'active'.

6. **Access Dashboard**

   - User receives club data and role in response.
   - Dashboard shows current club, events, payments, and messages ([BE-7], [BE-8]).

7. **Manual Testing in Postman**

   - All invitation/joining paths can be exercised with documented payloads.
   - Error and edge cases (invalid code, missing consent, duplicate join) are tested.

---

### How to Test in Postman

#### 1. Receive Invite/Join Code

- **POST /api/clubs/<clubId>/invite** (admin creates invite)
  - As documented in previous invite ticket.

#### 2. Sign Up / Log In

- **POST /api/auth/register**
  - Supply email, password, full profile, consent.
- **POST /api/auth/login**
  - Supply email, password.

#### 3. Accept Invite

- **POST /api/invites/accept**
  - **Headers:** Authorization: Bearer <user-jwt>
  - **Body:**
    ```json
    { "invite_code": "<code>" }
    ```
  - **Expected:** Success and user is linked to club with correct role.

#### 4. Provide Full Profile

- On registration, ensure fields: name, contact, emergency contact (and child info if needed).
- Can also PATCH profile after sign-up.

#### 5. Verify Consent

- Registration fails if `consent: true` is missing.

#### 6. Access Dashboard

- **GET /api/clubs**
  - Should return all clubs the user is a member of.
- **GET /api/clubs/<clubId>/events**
- **GET /api/clubs/<clubId>/messages**
- **GET /api/clubs/<clubId>/payments**

#### 7. Edge Cases

- Invalid invite code returns error.
- User already in club returns error.
- Missing consent or required fields: 400 Bad Request.

---

### References

- [Supabase Auth and Profiles](https://supabase.com/docs/guides/auth)
- [Club Members and Invites](see BE-9, BE-10)
- [Consent Requirements](https://gdpr.eu/what-is-consent/)

---

**Completion Criteria:**

- End-to-end invitation and joining flow is functional, secure, and user-friendly.
- All role assignments, profile fields, and consent status are correctly enforced and testable via API/Postman.
- User lands on populated dashboard upon joining a club.
