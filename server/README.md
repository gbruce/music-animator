# Music Animator Server

A Node.js backend server built with Express and Prisma, providing user authentication and management for the Music Animator application.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **TypeScript** for type safety

## Project Structure

```
server/
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma      # Prisma schema definition
│   └── migrations/        # Database migrations
├── src/
│   ├── controllers/       # Request handlers
│   │   └── userController.ts
│   ├── middleware/        # Custom middleware
│   │   └── auth.ts       # Authentication middleware
│   ├── routes/           # API routes
│   │   └── userRoutes.ts
│   ├── services/         # Business logic
│   │   └── userService.ts
│   ├── types/           # TypeScript type definitions
│   │   └── express.d.ts
│   └── index.ts         # Application entry point
```

## API Endpoints

### Authentication Routes

- **POST** `/api/users/signup`
  - Create a new user account
  - Body: `{ email: string, username: string, password: string }`
  - Returns: `{ user: User, token: string }`

- **POST** `/api/users/login`
  - Authenticate existing user
  - Body: `{ email: string, password: string }`
  - Returns: `{ user: User, token: string }`

- **GET** `/api/users/profile`
  - Get authenticated user's profile
  - Requires: Authentication token
  - Returns: `User` object

- **POST** `/api/users/request-reset`
  - Request password reset
  - Body: `{ email: string }`

- **POST** `/api/users/reset-password`
  - Reset password with token
  - Body: `{ email: string, token: string, newPassword: string }`

### Protected Routes
All protected routes require an `Authorization` header with a valid JWT token:
```
Authorization: Bearer <token>
```

## Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Setup and Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file with:
   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-super-secret-key-change-this-in-production"
   PORT=3001
   ```

3. Initialize database:
   ```bash
   npx prisma migrate dev
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

## Security Features

- Password hashing using bcryptjs
- JWT-based authentication
- Protected routes using middleware
- Input validation and sanitization
- CORS enabled
- Environment variable configuration
- Password reset functionality

## Error Handling

The server implements centralized error handling with appropriate HTTP status codes:

- 400: Bad Request - Invalid input
- 401: Unauthorized - Invalid credentials
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 409: Conflict - Resource already exists
- 500: Internal Server Error - Server-side issues

## Development Guidelines

1. Use TypeScript for all new files
2. Follow RESTful API conventions
3. Implement input validation
4. Write meaningful error messages
5. Keep business logic in services
6. Use middleware for cross-cutting concerns
7. Document new endpoints and changes 