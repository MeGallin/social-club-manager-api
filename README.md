# Social Club Manager API

Backend API for the Social Club Management Platform - a volunteer-led club management system supporting events, payments, messaging, and member management.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
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

- `GET /api/health` - Returns API status and uptime

### Root

- `GET /` - Returns basic API information

## Environment Variables

| Variable      | Description               | Default                              |
| ------------- | ------------------------- | ------------------------------------ |
| `PORT`        | Server port               | `8000`                               |
| `NODE_ENV`    | Environment mode          | `development`                        |
| `CORS_ORIGIN` | Allowed CORS origin       | `http://localhost:5173`              |
| `MONGO_URI`   | MongoDB connection string | `mongodb://localhost:27017/clubmgmt` |
| `JWT_SECRET`  | JWT signing secret        | `changeme_in_production`             |

## Project Structure

```
api/
├── src/
│   ├── controllers/     # Route controllers (future)
│   ├── middlewares/     # Express middleware
│   ├── models/          # Database models (future)
│   ├── routes/          # Route definitions
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

- All errors are handled by centralized error middleware
- Development mode includes stack traces
- Production mode returns clean error messages

### CORS

- Configured to allow requests from frontend origin
- Credentials enabled for authentication cookies

## Upcoming Features

This MVP backend will be extended with:

- User authentication & authorization
- Club management APIs
- Event management
- Payment processing
- Real-time messaging
- File uploads
- Member management

## Contributing

1. Create feature branch
2. Make changes following existing patterns
3. Test endpoints manually
4. Submit pull request

## License

ISC
