## [BE-2] Base Middleware & Error Handling

### Goal

Add robust global middleware for request logging, error handling, and security to the Express backend.  
This ensures reliable debugging, clear error responses, and basic protection from common vulnerabilities from the outset.

---

### Acceptance Criteria

- All incoming HTTP requests are logged with method, URL, and status
- CORS is enabled and configured per environment (`CORS_ORIGIN` in `.env`)
- All JSON payloads are automatically parsed (`express.json`)
- Unhandled routes return a JSON 404 error (`{ error: 'Not found' }`)
- Central error handler returns JSON error details (in dev) or generic error (in prod)
- Security middleware (`helmet`) is used to set safe HTTP headers
- Middleware is organized and imported cleanly in `app.js`
- Code is linted and follows repo style
- All endpoints (including errors) can be manually tested via Postman with documented request/response

---

### Tasks

1. **Add Logging Middleware**

   - Install and configure [`morgan`](https://www.npmjs.com/package/morgan)
   - Log incoming request method, path, status, and response time

2. **Enable and Configure CORS**

   - Use `cors` package, read allowed origin from `.env`
   - Export reusable middleware in `middlewares/cors.js`

3. **JSON Payload Parsing**

   - Add `express.json()` middleware globally in `app.js`

4. **Security Headers**

   - Install [`helmet`](https://www.npmjs.com/package/helmet) and use it globally for secure HTTP headers

5. **404 Handler**

   - Add middleware to catch unmatched routes and return:
     ```json
     { "error": "Not found" }
     ```
   - Return 404 status

6. **Central Error Handler**

   - Add error-handling middleware in `middlewares/errorHandler.js`
   - Respond with detailed error info (`err.message`, `stack`) in development
   - Respond with generic error message in production (no stack trace)

7. **Middleware Order**

   - Ensure middleware order in `app.js` is:
     - helmet
     - cors
     - json parser
     - morgan logger
     - routes
     - 404 handler
     - error handler

8. **Lint and Test**
   - Ensure all code passes linter
   - Manual test for:
     - Good request (logs, response OK)
     - Bad route (404)
     - Throw error in a route (triggers error handler)

---

### How to Test Endpoints in Postman

#### 1. Healthcheck Endpoint

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/health`
- **Headers:** (none required)
- **Expected Response:**
  ```json
  { "status": "ok" }
  ```
