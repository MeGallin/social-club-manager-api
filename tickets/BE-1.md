## [BE-1] Initialize Node.js/Express Backend Repo

### Goal

Set up the initial backend repository with all boilerplate required to support further development.  
Includes Node/Express server, environment config, base middleware (CORS, JSON parsing), and a scalable folder structure.

---

### Acceptance Criteria

- Git repository is initialized and pushed to the chosen remote (e.g., GitHub)
- `npm init` run; `package.json` created
- Express server runs on port **8000**
- `.env` file loaded via dotenv (with default PORT, MONGO_URI, JWT_SECRET)
- CORS enabled (allow configurable origin)
- Basic middleware (body-parser/express.json, error handler)
- Initial folder structure prepared for modular scaling
- Readme with setup/run instructions
- Server responds to a basic healthcheck endpoint (`GET /api/health`)
- Linting and Prettier set up for code consistency

---

### Tasks

1. **Initialize Repo**

   - Create new directory and initialize Git repo
   - Add `.gitignore` (node_modules, .env, logs)

2. **Node.js/Express Setup**

   - Run `npm init -y`
   - Install dependencies:  
     `express`, `dotenv`, `cors`, `morgan` (for logging), `nodemon` (dev),  
     `eslint` + `prettier` (dev, optional)
   - Add scripts to `package.json`:
     - `"dev": "nodemon src/server.js"`
     - `"start": "node src/server.js"`

3. **Environment Config**

   - Create `.env` with defaults:
     ```
     PORT=8000
     MONGO_URI=mongodb://localhost:27017/clubmgmt
     JWT_SECRET=changeme
     CORS_ORIGIN=http://localhost:5173/
     ```
   - Load env vars using `dotenv` in app entry

4. **Basic Folder Structure**

5. **Create Express App**

- `src/app.js`: Initialize express, add CORS, JSON middleware, healthcheck route
- `src/server.js`: Import app, listen on `process.env.PORT`, log startup
- Add healthcheck endpoint:
  ```js
  router.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  ```

6. **CORS Middleware**

- Enable CORS using allowed origin from `.env`
- Export as reusable middleware

7. **Error Handling**

- Add base error handler middleware in `/middlewares`
- Ensure unhandled routes and errors are caught with JSON response

8. **Readme & Linting**

- Add basic setup/run instructions to `README.md`
- (Optional) Set up ESLint/Prettier config

---

### Deliverables

- Repo pushed with all above implemented
- Able to run locally with `npm run dev` and access `GET /api/health` on port 8000
- Clear structure ready for adding routes, models, and further middleware

---

### Example healthcheck response

```json
GET /api/health

{
"status": "ok"
}
```
