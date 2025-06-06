## [BE-8] Club Onboarding Workflow (Supabase + API)

### Goal

Implement a guided onboarding API workflow for new club creators.  
Ensure that after registration, a user can create their first club, select which modules to enable, and invite initial members via the API.  
Automate user assignment as club owner/admin and return club data for frontend setup.

---

### Acceptance Criteria

- API endpoint(s) allow a new authenticated user to create their club and select modules in a single onboarding step.
- The creating user is automatically set as the club's owner (`creator_id` in `public.clubs`).
- The endpoint validates club name, type, and enabled modules.
- (Optional) Endpoint can accept a list of initial member invite emails to queue for invites (future extension).
- API returns the created club object, ready for frontend to proceed to next onboarding step.
- Standard errors for missing/invalid data.
- Fully testable via Postman.

---

### Tasks

1. **Design Onboarding API Endpoint**

   - **Route:** `POST /api/onboarding/club`
   - **Input:**
     ```json
     {
       "name": "Club Name",
       "type": "sports",
       "description": "Club description",
       "logo_url": "https://example.com/logo.png",
       "enabled_modules": ["events", "payments"],
       "invite_emails": ["coach@example.com", "parent@example.com"] // (optional/future)
     }
     ```
   - Requires valid JWT.

2. **Implement Endpoint Logic**

   - Validate required fields (`name`, `type`, at least one module).
   - Insert into `public.clubs` using Supabase client with `creator_id` from JWT.
   - Return club object.

3. **Assign User as Club Owner/Admin**

   - Set `creator_id` to the authenticated user's id.
   - (Optional) Add logic to assign a role in a `club_members` table for future multi-admin support.

4. **Invite Initial Members (Future/Optional)**

   - (If provided) accept emails, queue for invitation logic in a later ticket.

5. **Return Onboarding Response**

   - On success, return created club object.
   - On failure, return appropriate error.

6. **Document Endpoint**

   - Add usage to README/API docs.

7. **Manual Testing in Postman**
   - Create club via onboarding endpoint and confirm owner assignment.
   - Test error scenarios (missing field, invalid type, etc.).

---

### How to Test in Postman

#### **1. Club Onboarding**

- **Method:** POST
- **URL:** `http://localhost:8000/api/onboarding/club`
- **Headers:**
  - `Authorization: Bearer <jwt>`
  - `Content-Type: application/json`
- **Body Example:**
  ```json
  {
    "name": "Brighton Chess Club",
    "type": "hobby",
    "description": "A club for chess enthusiasts.",
    "logo_url": "https://example.com/logo.png",
    "enabled_modules": ["events", "messaging", "payments"]
  }
  ```

---

## ✅ IMPLEMENTATION COMPLETE

**Status:** COMPLETED ✅  
**Date:** June 6, 2025  
**Implementation Files:**

- `src/controllers/onboardingController.js` - HTTP request handler for onboarding workflow
- `src/routes/onboarding.js` - Route definitions for onboarding endpoints
- `src/app.js` - Updated with onboarding routes registration
- `docs/BE-8-IMPLEMENTATION-COMPLETE.md` - Full implementation documentation
- `docs/BE-8-Postman-Collection.json` - Postman test collection

**All Acceptance Criteria Met:**

- ✅ API endpoint allows authenticated user to create club and select modules in single onboarding step
- ✅ Creating user automatically set as club owner (`creator_id` from JWT)
- ✅ Validates club name, type, and enabled modules (at least one module required)
- ✅ Returns created club object ready for frontend to proceed to next step
- ✅ Standard error handling for missing/invalid data
- ✅ Fully testable via Postman
- ✅ Optional invite emails field prepared for future extension

**Key Implementation Features:**

- **Enhanced Validation:** Requires at least one enabled module (onboarding-specific requirement)
- **Onboarding Context:** Returns completion status and suggested next steps
- **Future-Ready:** Prepared for member invitation workflow
- **Security:** Uses existing JWT authentication and Supabase RLS policies
- **Consistency:** Follows established API patterns and error handling

**Ready for Production:** The onboarding workflow is fully implemented and integrated into the existing API infrastructure.
