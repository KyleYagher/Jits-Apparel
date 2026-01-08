# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Jits Apparel** is a full-stack e-commerce application:
- **Backend**: ASP.NET Core 9.0 Web API (`Jits-Apparel.Server/`)
- **Frontend**: React 19 + TypeScript + Vite SPA (`jits-apparel.client/`)
- **Database**: PostgreSQL (port 5433)
- **Authentication**: JWT with refresh token rotation using ASP.NET Identity

## Common Commands

### Backend (ASP.NET Core)

Run from `Jits-Apparel.Server/` directory:

```bash
# Restore packages
dotnet restore

# Run the application (includes SPA proxy to frontend)
dotnet run

# Build the application
dotnet build

# Database migrations
dotnet ef migrations add <MigrationName>
dotnet ef database update
dotnet ef database drop  # Drops dev database

# Run with watch mode
dotnet watch run
```

### Frontend (React + Vite)

Run from `jits-apparel.client/` directory:

```bash
# Install dependencies
npm install

# Run dev server (https://localhost:62169)
npm run dev

# Build for production
npm run build

# Type-check and build
tsc -b && vite build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Database Setup

```bash
# Run from root directory with PostgreSQL running
psql -U postgres -f setup_db.sql

# This creates:
# - jitsdb (production database)
# - jitsdb_dev (development database)
# - jitsapi user with password S3rv3r01!
```

### Running the Full Application

The backend serves the frontend in production. For development, run both separately:

```bash
# Terminal 1: Frontend dev server
cd jits-apparel.client
npm run dev

# Terminal 2: Backend API
cd Jits-Apparel.Server
dotnet run
```

The Vite dev server proxies `/api` requests to the backend at `https://localhost:7044`.

## Architecture

### Project Structure

```
Jits-Apparel.Server/          # Backend API
├── Controllers/              # HTTP request handlers
├── Models/
│   ├── Entities/            # EF Core database entities
│   ├── DTOs/                # Data Transfer Objects for API
│   ├── Configuration/       # App configuration models
│   └── Enums/               # Shared enumerations
├── Data/                    # DbContext and database config
├── Services/                # Business logic (TokenService, EmailService)
├── Migrations/              # EF Core database migrations
└── appsettings*.json        # Configuration files

jits-apparel.client/          # Frontend SPA
├── src/
│   ├── screens/             # Page-level components (Home, Dashboard, etc.)
│   ├── components/          # Reusable UI components
│   │   └── ui/              # Radix UI-based component library
│   ├── context/             # React Context providers (Auth, Cart, Theme)
│   ├── services/            # API client and business logic
│   ├── router/              # React Router configuration
│   └── types/               # TypeScript type definitions
└── vite.config.ts           # Vite bundler configuration
```

### Database Models

Key entities in `Models/Entities/`:

- **User** (extends IdentityUser): Custom fields include FirstName, LastName, Address, etc.
- **Product**: Name, Price, Description, StockQuantity, ImageUrl, IsActive, IsFeatured, CategoryId
- **Category**: Product categories with Name and Description
- **Order**: OrderNumber, OrderDate, Status (enum), TotalAmount, UserId
- **OrderItem**: Junction table linking Products to Orders with Quantity
- **RefreshToken**: Stores JWT refresh tokens with expiration and revocation tracking

The DbContext (`Data/JitsDbContext.cs`) extends `IdentityDbContext<User, IdentityRole<int>, int>`.

### Authentication Flow

**JWT Token Strategy:**
- **Access tokens**: Short-lived (15 min production, 60 min dev) stored in localStorage as `jits-access-token`
- **Refresh tokens**: Long-lived (7 days production, 30 days dev) stored in localStorage as `jits-refresh-token` and database
- **Token rotation**: Old refresh token is revoked when new one is generated
- **User roles**: Admin, Customer, Manager (seeded on startup)

**Frontend Auth:**
- `AuthProvider` context in `context/AuthProvider.tsx` manages session state
- `ApiClient` in `services/api.ts` automatically injects Bearer token from localStorage
- Session persists across page reloads via localStorage
- Token validation on app load via `/api/auth/me` endpoint

**Backend Auth:**
- Configured in `Program.cs` with JWT Bearer authentication
- `TokenService.cs` generates and validates tokens
- Role-based authorization: `[Authorize(Roles = "Admin")]` on admin-only endpoints
- Admin endpoints: All Product CRUD operations, bulk upload

### API Communication

Frontend uses custom `ApiClient` class (`services/api.ts`):
- Base URL: `/api` (proxied to backend in dev)
- Methods: `get()`, `post()`, `delete()`, `patch()`
- Automatically adds `Authorization: Bearer {token}` header
- Handles 204 No Content responses

Key API endpoints:
- `/api/auth/*` - Authentication (register, login, refresh-token, logout, verify-email, reset-password)
- `/api/products` - Product CRUD (admin-only mutations)
- `/api/products/category/{id}` - Filter by category
- `/api/products/{id}/toggle-featured` - Toggle featured status (admin)
- `/api/products/upload` - Bulk CSV upload (admin)

### Configuration

**Backend (`appsettings.json`):**
- PostgreSQL connection string (port 5433, database `jitsdb`, user `jitsapi`)
- JWT settings (SecretKey, Issuer, Audience, token expiration times)
- Email settings (SMTP configuration for password reset emails)

**Backend (`appsettings.Development.json`):**
- Uses `jitsdb_dev` database
- Longer token expiration (60 min access, 30 days refresh)
- Debug logging enabled

**Frontend (`vite.config.ts`):**
- Dev server port: 62169 (or `DEV_SERVER_PORT` env var)
- Proxy `/api` to `https://localhost:7044`
- Path alias: `@` → `src/`
- HTTPS dev certs auto-generated

## Development Workflow

### Adding New Features

1. **Database changes**: Create migration with `dotnet ef migrations add <Name>`, then `dotnet ef database update`
2. **Backend API**: Add/update DTOs in `Models/DTOs/`, add controller methods in `Controllers/`
3. **Frontend API**: Add methods to `ApiClient` in `services/api.ts`
4. **Frontend UI**: Create/update components in `components/` and screens in `screens/`

### Role-Based Features

Admin-only features require:
- Backend: `[Authorize(Roles = "Admin")]` attribute on controller method
- Frontend: Check `user.roles.includes('Admin')` in `AuthContext` to show/hide UI

To promote a user to admin in development:
- Use the debug endpoint: `POST /api/auth/promote-to-admin` with user's email

### State Management

Global state via React Context:
- **AuthContext**: User session, login/logout, token management
- **CartContext**: Shopping cart items, add/remove/update quantities
- **ThemeContext**: Dark/light mode toggle

Access context with: `const { user, login, logout } = useAuth()`

### Testing Changes

1. Run backend: `cd Jits-Apparel.Server && dotnet run`
2. Run frontend: `cd jits-apparel.client && npm run dev`
3. Backend listens on `https://localhost:7044`
4. Frontend listens on `https://localhost:62169`
5. Test API directly at `https://localhost:7044/api/*`

### Common Issues

**CORS errors**: Backend has CORS configured for `https://localhost:62169`. Update in `Program.cs` if needed.

**Database connection errors**: Ensure PostgreSQL is running on port 5433 with correct credentials in `appsettings.json`.

**401 Unauthorized**: Check that access token hasn't expired (15 min in production). Frontend should auto-refresh via refresh token.

**Migration errors**: If migrations conflict, drop dev database with `dotnet ef database drop` and reapply with `dotnet ef database update`.

## Technology Stack

- **Backend**: ASP.NET Core 9.0, Entity Framework Core 9.0, ASP.NET Identity, JWT Bearer
- **Database**: PostgreSQL 13+ via Npgsql
- **Frontend**: React 19, TypeScript 5.9, Vite 7.2, React Router 7
- **UI Components**: Radix UI (@radix-ui/react-*) - comprehensive primitives library
- **Styling**: Tailwind CSS v4 with dark/light mode
- **Forms**: React Hook Form
- **Notifications**: Sonner (toast library)
- **Charts**: Recharts

## Key Files

- `Jits-Apparel.Server/Program.cs` - Backend startup, DI container, middleware, JWT config
- `Jits-Apparel.Server/Data/JitsDbContext.cs` - EF Core DbContext with all entities
- `jits-apparel.client/src/services/api.ts` - Frontend API client
- `jits-apparel.client/src/context/AuthProvider.tsx` - Authentication state management
- `jits-apparel.client/src/router/AppRouter.tsx` - React Router setup
- `jits-apparel.client/vite.config.ts` - Vite bundler config with API proxy
