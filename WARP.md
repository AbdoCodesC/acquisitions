# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an Express-based RESTful API service for an acquisitions system. It uses Node.js with ES modules, PostgreSQL via Neon serverless, and Drizzle ORM for database management.

## Common Commands

### Development
```bash
npm run dev              # Start development server with auto-reload (--watch)
```

### Code Quality
```bash
npm run lint             # Run ESLint to check for issues
npm run lint:fix         # Auto-fix ESLint issues
npm run format:check     # Check code formatting with Prettier
npm run format           # Auto-format code with Prettier
```

### Database Operations
```bash
npm run db:generate      # Generate migration files from schema changes
npm run db:migrate       # Apply pending migrations to database
npm run db:studio        # Open Drizzle Studio for database GUI
```

## Architecture & Code Organization

### Import Aliases
The project uses Node.js subpath imports (defined in `package.json`) for clean imports:
- `#config/*` → `./src/config/*`
- `#models/*` → `./src/models/*`
- `#routes/*` → `./src/routes/*`
- `#controllers/*` → `./src/controllers/*`
- `#middleware/*` → `./src/middleware/*`
- `#utils/*` → `./src/utils/*`
- `#services/*` → `./src/services/*`
- `#validations/*` → `./src/validations/*`

Always use these aliases instead of relative imports.

### Application Flow
1. **Entry Point**: `src/index.js` loads environment variables and starts the server
2. **Server Setup**: `src/server.js` initializes the Express app from `src/app.js`
3. **App Configuration**: `src/app.js` sets up middleware (helmet, cors, cookie-parser, morgan) and routes
4. **Request Flow**: Route → Validation → Controller → Service → Database

### Key Architectural Patterns

#### Layered Architecture
- **Routes** (`src/routes/`): Define API endpoints and map to controllers
- **Controllers** (`src/controllers/`): Handle HTTP requests/responses, validation, and orchestration
- **Services** (`src/services/`): Contain business logic and database operations
- **Models** (`src/models/`): Define Drizzle ORM schemas for database tables
- **Validations** (`src/validations/`): Zod schemas for request validation
- **Utils** (`src/utils/`): Reusable utility functions (JWT, cookies, formatting)
- **Config** (`src/config/`): Configuration for database connections and logging

#### Database Layer
- **ORM**: Drizzle ORM with Neon serverless PostgreSQL
- **Connection**: Initialized in `src/config/database.js`, exports `db` (Drizzle instance) and `sql` (Neon client)
- **Schema Definition**: Models use Drizzle's `pgTable` API (see `src/models/user.model.js`)
- **Migrations**: Stored in `./drizzle/` directory, managed via `drizzle-kit`

#### Authentication & Security
- **JWT**: Generated and verified via `#utils/jwt.js`, stored in HTTP-only cookies
- **Password Hashing**: Uses bcryptjs with 10 salt rounds
- **Cookie Management**: Centralized in `#utils/cookies.js` with secure defaults
- **Security Headers**: Helmet middleware enabled
- **CORS**: Configured in `app.js`

#### Logging
- **Winston Logger**: Configured in `src/config/logger.js`
- **Log Levels**: Controlled by `LOG_LEVEL` environment variable (default: 'info')
- **Output**: Console (development) + file transports (`logs/combined.log`, `logs/error.log`)
- **HTTP Logging**: Morgan middleware integrated with Winston

#### Validation
- **Library**: Zod for schema validation
- **Pattern**: Validate in controllers using `.safeParse()`, format errors via `#utils/format.js`
- **Error Handling**: Return 400 with formatted validation errors

### Environment Variables
Required variables (see `.env`):
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Winston log level (default: 'info')
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `JWT_SECRET`: Secret key for JWT signing (optional, has default)

### Code Style Conventions
- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Line endings**: LF (Unix)
- **Arrow functions**: Preferred over function expressions
- **const/let**: Use `const` by default, never `var`
- **Unused args**: Prefix with `_` to ignore lint warnings

### Testing Configuration
ESLint config includes Jest globals for test files in `tests/**/*.js` directory, though no tests currently exist.

## Development Guidelines

### Adding New Features
1. **Database Schema**: Define model in `src/models/` using Drizzle's `pgTable`
2. **Generate Migration**: Run `npm run db:generate` after schema changes
3. **Apply Migration**: Run `npm run db:migrate` to update database
4. **Validation Schema**: Create Zod schema in `src/validations/`
5. **Service Layer**: Implement business logic in `src/services/`
6. **Controller**: Create controller in `src/controllers/` with validation and error handling
7. **Route**: Register route in `src/routes/` and mount in `src/app.js`

### Error Handling
- Services throw descriptive errors that controllers catch
- Controllers return appropriate HTTP status codes (400 for validation, 409 for conflicts, etc.)
- Use logger for all error logging
- Pass unhandled errors to Express error handler via `next(error)`

### Database Operations with Drizzle
- Import `db` from `#config/database.js`
- Import table schemas from `#models/*`
- Use Drizzle query builders: `.select()`, `.insert()`, `.update()`, `.delete()`
- Use `.where(eq(table.column, value))` for filtering
- Chain `.returning()` to get inserted/updated data
- Always `.limit()` queries when expecting single results

### Working with Authentication
- JWT tokens are stored in HTTP-only cookies (not localStorage)
- Cookie lifespan: 15 minutes (configurable in `cookies.getOptions()`)
- JWT expiration: 1 day (configurable via `JWT_EXPIRES_IN` in `jwt.js`)
- Token payload includes: `userId`, `email`, `role`
