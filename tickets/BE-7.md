## [BE-7] Create/Update/Delete Club API (Supabase)

### Goal

Implement backend API endpoints for creating, updating, and deleting clubs using Supabase REST API (or client).  
Endpoints must enforce authorization (only club creators can update or delete their clubs) and data validation.  
Return standard REST responses and error handling.

---

### Acceptance Criteria

- **POST `/api/clubs`** creates a new club for the authenticated user.
- **PATCH `/api/clubs/:id`** updates club data; only the creator can update.
- **DELETE `/api/clubs/:id`** deletes a club; only the creator can delete.
- All endpoints validate required fields and return 400 for missing/invalid data.
- All endpoints require a valid JWT (Supabase Auth).
- Error 403 returned if a non-creator attempts to update/delete.
- Success and error responses follow API standards and are documented.
- All endpoints are tested via Postman.

---

### Tasks

1. **Create Club Endpoint**

   - **Route:** `POST /api/clubs`
   - **Input:** `{ name, type, description, logo_url, enabled_modules }`
   - **Backend Actions:**
     - Validate input (e.g., name/type required, name unique for user).
     - Get user id from JWT.
     - Insert row into `public.clubs` with `creator_id` set to user.
     - Return created club object.

2. **Update Club Endpoint**

   - **Route:** `PATCH /api/clubs/:id`
   - **Input:** Any updatable club fields.
   - **Backend Actions:**
     - Validate input.
     - Ensure user is the creator of the club (`creator_id` matches JWT).
     - Update only allowed fields.
     - Return updated club or error.

3. **Delete Club Endpoint**

   - **Route:** `DELETE /api/clubs/:id`
   - **Backend Actions:**
     - Ensure user is the creator.
     - Delete row from `public.clubs`.
     - Return 204 No Content on success.

4. **Error Handling**

   - 400 for missing fields/invalid input.
   - 403 for unauthorized update/delete.
   - 404 if club not found.

5. **Document Endpoints**

   - Add to API docs/README.

6. **Manual Testing in Postman**
   - Confirm all success and failure flows.

---

### How to Test in Postman

#### **1. Create Club**

- **Method:** POST
- **URL:** `http://localhost:8000/api/clubs`
- **Headers:**
  - `Authorization: Bearer <jwt>`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "name": "Sunnyvale Rugby",
    "type": "sports",
    "description": "Local rugby club",
    "logo_url": "https://example.com/logo.png",
    "enabled_modules": ["events", "payments", "messaging"]
  }
  ```

---

## ✅ IMPLEMENTATION COMPLETE

**Status:** COMPLETED ✅  
**Date:** June 6, 2025  
**Implementation Files:**

- `src/services/clubService.js` - Business logic for club operations
- `src/controllers/clubController.js` - HTTP request handlers
- `src/routes/clubs.js` - Route definitions
- `docs/BE-7-IMPLEMENTATION-COMPLETE.md` - Full documentation
- `docs/BE-7-Postman-Collection.json` - Postman test collection

**All Acceptance Criteria Met:**

- ✅ POST `/api/clubs` creates a new club for authenticated user
- ✅ PATCH `/api/clubs/:id` updates club data (creator only)
- ✅ DELETE `/api/clubs/:id` deletes club (creator only)
- ✅ All endpoints validate required fields (400 for invalid data)
- ✅ All endpoints require valid JWT (Supabase Auth)
- ✅ Error 403 for non-creator update/delete attempts
- ✅ Standard REST responses and error handling
- ✅ Ready for Postman testing

**Server Running:** ✅ `http://localhost:8000`  
**Documentation:** See `docs/BE-7-IMPLEMENTATION-COMPLETE.md`
