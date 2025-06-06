# Social Club Manager API

Backend API for the Social Club Management Platform - a volunteer-led club management system supporting events, payments, messaging, and member management.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Security:** Helmet for security headers
- **Logging:** Morgan for HTTP request logging
- **Database:** MongoDB (future)
- **Authentication:** JWT (future)
- **Real-time:** Socket.io (future)

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (for future database integration)

### Installation

1. Navigate to the API directory:

```bash
cd api
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The API will be running on `http://localhost:8000`

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

## API Endpoints

### Health Check

- `GET /api/health` - Returns detailed API status, uptime, and system information

### Authentication

- `POST /api/auth/register` - Register a new user (requires GDPR consent)
- `POST /api/auth/login` - Login with email and password

### Profile Management

- `GET /api/profiles` - Get all profiles (admin)
- `GET /api/profiles/:id` - Get specific profile by ID
- `PUT /api/profiles/:id` - Update profile by ID
- `GET /api/profiles/me` - Get current user's profile
- `PUT /api/profiles/me` - Update current user's profile

### GDPR/Privacy Consent

- `GET /api/profile/consent` - Get user's consent status (requires JWT)
- `PUT /api/profile/consent` - Update user's consent status (requires JWT)

### Root

- `GET /` - Returns basic API information

### Development Only

- `GET /api/test-error` - Test error handling (development environment only)

## GDPR/Privacy Compliance

This API implements strict GDPR compliance for user consent:

### Registration Requirements

- **GDPR Consent Required**: All user registrations MUST include explicit consent
- **Consent Validation**: The `consent` field must be explicitly set to `true`
- **Blocked Registration**: Registration will fail if consent is not provided or set to `false`

### Consent Management

Users can view and update their consent status through protected endpoints:

- **View Consent**: `GET /api/profile/consent` (requires authentication)
- **Update Consent**: `PUT /api/profile/consent` (requires authentication)

### Example Registration with Consent

```json
{
  "email": "user@tws.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "consent": true
}
```

### Data Storage

- Consent status stored in `public.profiles` table
- Consent date automatically tracked
- User metadata includes consent information

## Testing with Postman

### 1. Health Check Endpoint

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/health`
- **Expected Response:**

  ```json
  {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 123.456,
    "environment": "development",
    "version": "1.0.0",
    "memory": {
      "used": 25.67,
      "total": 50.12,
      "external": 2.34
    },
    "checks": {
      "server": "healthy"
    }
  }
  ```

### 2. Test 404 Error

- **Method:** `GET`
- **URL:** `http://localhost:8000/nonexistent-route`
- **Expected Response:**

  ```json
  {
    "success": false,
    "error": "Route not found - GET /nonexistent-route",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/nonexistent-route"
  }
  ```

### 3. Test Error Handling (Development Only)

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/test-error`
- **Expected Response:**

  ```json
  {
    "success": false,
    "error": "This is a test error",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/test-error",
    "stack": "Error: This is a test error\n    at ...",
    "details": {
      "name": "Error",
      "statusCode": 500
    }
  }
  ```

## Environment Variables

| Variable      | Description                            | Default                              |
| ------------- | -------------------------------------- | ------------------------------------ |
| `PORT`        | Server port                            | `8000`                               |
| `NODE_ENV`    | Environment mode                       | `development`                        |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173`              |
| `MONGO_URI`   | MongoDB connection string              | `mongodb://localhost:27017/clubmgmt` |
| `JWT_SECRET`  | JWT signing secret                     | `changeme_in_production`             |

## Security Features

- **Helmet:** Security headers including CSP, HSTS, and more
- **CORS:** Configurable cross-origin resource sharing
- **Request Size Limits:** JSON and URL-encoded payloads limited to 10MB
- **Error Handling:** Sanitized error responses in production

## Middleware Stack

1. **Trust Proxy:** For accurate IP addresses behind proxies
2. **Helmet:** Security headers
3. **CORS:** Cross-origin resource sharing
4. **Body Parser:** JSON and URL-encoded parsing
5. **Morgan:** HTTP request logging
6. **Routes:** Application routes
7. **404 Handler:** Catch unmatched routes
8. **Error Handler:** Central error handling

## Project Structure

```
api/
├── src/
│   ├── controllers/     # Route controllers (future)
│   ├── middlewares/     # Express middleware
│   │   ├── cors.js      # CORS configuration
│   │   ├── errorHandler.js # Error handling
│   │   ├── logger.js    # Request logging
│   │   └── security.js  # Security headers
│   ├── models/          # Database models (future)
│   ├── routes/          # Route definitions
│   │   └── health.js    # Health check routes
│   ├── services/        # Business logic (future)
│   ├── utils/           # Utility functions (future)
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
├── .env                 # Environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## Development

### Code Style

- ESLint for linting
- Prettier for formatting
- Follow existing patterns for consistency

### Error Handling

- Centralized error middleware handles all errors
- Development mode includes detailed error information
- Production mode returns sanitized error messages
- Async error wrapper available for route handlers

### Logging

- HTTP requests logged with method, URL, status, and response time
- Different formats for development and production
- Health check requests skipped in production logs

### CORS Configuration

- Multiple origins supported (comma-separated in .env)
- Credentials enabled for authentication
- Preflight requests handled automatically

## Contributing

1. Create feature branch
2. Make changes following existing patterns
3. Test endpoints with Postman or curl
4. Ensure linting passes
5. Submit pull request

## License

ISC
