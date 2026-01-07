# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jits Apparel is a full-stack e-commerce application for apparel sales. The frontend is a React + TypeScript + Vite SPA, and the backend is an ASP.NET Core 9.0 Web API with PostgreSQL database.

## Development Commands

### Frontend (React/Vite)
```bash
npm run dev          # Start development server (https://localhost:62169)
npm run build        # Type-check with tsc, then build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
```

### Backend (ASP.NET Core)
The backend is located in `../Jits-Apparel.Server/`. Run from the server directory:
```bash
dotnet run           # Start the API server (https://localhost:7044)
dotnet build         # Build the project
dotnet ef migrations add <name>  # Create a new EF Core migration
dotnet ef database update        # Apply migrations to database
```

### Database Setup
PostgreSQL must be running on port 5433. Use `../Jits-Apparel.Server/setup_db.sql` to create databases:
```bash
psql -U postgres -f ../Jits-Apparel.Server/setup_db.sql
```
- Production DB: `jitsdb`
- Development DB: `jitsdb_dev`
- User: `jitsapi` / Password: `S3rv3r01!`

## Architecture

### Frontend Structure

**Entry Point & Providers:**
- `src/main.tsx` - App entry with `ThemeProvider` and `AuthProvider` wrappers
- `src/App.tsx` - Wraps router with `CartProvider` and Toaster for notifications

**Context Providers (in `context/`):**
- `AuthProvider` - JWT authentication, login/logout state, token storage
- `CartProvider` - Shopping cart state management
- `ThemeProvider` - Dark mode / light mode theming

**Routing:**
- `src/router/routes.ts` - React Router config with Layout wrapper
- All routes use a shared Layout component with Navigation
- Routes: `/`, `/shop`, `/about`, `/checkout`, `/theme`, `/profile`, `/login`, `/register`

**Screens (in `src/screens/`):**
- Page-level components: `Home`, `Shop`, `About`, `Checkout`, `Login`, `Register`, `UserProfile`, `Theme`

**Components (in `src/components/`):**
- `Layout.tsx` - Main layout wrapper with Navigation
- `Navigation.tsx` - Nav bar with cart, auth, and theme toggle
- `HeroCarousel.tsx`, `ProductCard.tsx`, `ProductDetail.tsx` - Product UI
- `ShoppingCartDrawer.tsx` - Slide-out cart drawer
- `CheckoutPage.tsx` - Checkout flow
- `ThemeToggle.tsx` - Dark/light mode switcher
- `JitsLogo.tsx`, `JitsLogoText.tsx` - Branding components
- `ui/` - Radix UI component library (shadcn/ui style)

**API Layer (in `src/services/`):**
- `api.ts` - `ApiClient` class for all API requests
  - Handles JWT token injection from localStorage (`jits-access-token`)
  - Base URL: `/api` (proxied to backend in dev)
  - Methods: `login()`, `register()`, `getCurrentUser()`, generic `get()`, `post()`
- `productService.ts` - Product-specific API calls

### Backend Structure (ASP.NET Core)

**Project:** `../Jits-Apparel.Server/`
- Namespace: `Jits.API`
- Framework: .NET 9.0
- Database: PostgreSQL via Entity Framework Core (Npgsql)

**Controllers:**
- `AuthController.cs` - Login, register, token refresh, user profile
- `ProductsController.cs` - CRUD operations for products
- `CategoriesController.cs` - Product categories
- `OrdersController.cs` - Order management
- `UsersController.cs` - User management

**Models (in `Models/`):**
- `Entities/` - EF Core entity models
- `DTOs/` - Data transfer objects for API requests/responses
- `Configuration/` - App configuration models (JWT, email settings)
- `Enums/` - Shared enumerations

**Data:**
- `Data/JitsDbContext.cs` - EF Core DbContext

**Services:**
- Located in `Services/` directory (authentication, business logic)

**Configuration:**
- JWT authentication with Bearer tokens
- Connection string in `appsettings.json` (PostgreSQL on port 5433)
- API proxied from Vite dev server via `/api` prefix

### Key Technical Decisions

**Authentication:**
- JWT tokens stored in localStorage (`jits-access-token`, `jits-refresh-token`)
- Bearer token auto-injected in API requests via `ApiClient`
- Auth state managed globally via `AuthProvider` context

**Styling:**
- Tailwind CSS v4 with custom theme via CSS variables (`--primary`, `--background`, etc.)
- Dark mode support via `class` strategy
- Path alias `@/` points to `src/` directory

**Dev Server:**
- Vite runs on https://localhost:62169 with auto-generated dev certs
- Backend proxied via `/api` routes in `vite.config.ts`
- Backend targets https://localhost:7044

**UI Library:**
- Extensive Radix UI primitives (@radix-ui/react-*)
- Custom components in `src/components/ui/`
- Notifications via Sonner toast library

## Important Files

- `vite.config.ts` - Vite config with HTTPS dev certs, API proxy, Tailwind plugin
- `tailwind.config.js` - Tailwind v4 config with theme extensions
- `tsconfig.json` - TypeScript project references setup
- `../Jits-Apparel.Server/Program.cs` - Backend startup and middleware configuration
- `../Jits-Apparel.Server/appsettings.json` - Backend configuration (DB, JWT, email)

## Data Models

**Database Schema:**
See Entity models in `../Jits-Apparel.Server/Models/Entities/` for complete schema. Core entities likely include:
- Users (authentication, profiles)
- Products (catalog items)
- Categories (product categorization)
- Orders (purchase records)
- Order items, shopping cart, etc.

Use EF Core migrations to modify the database schema.
