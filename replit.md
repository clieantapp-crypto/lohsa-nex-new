# Nexa Flow - Insurance Applications Dashboard

## Overview

Nexa Flow is an Arabic-language insurance applications management dashboard built with a React frontend and Express backend. The application allows users to create, view, update, and manage insurance applications with detailed vehicle and payment information. The interface is designed for right-to-left (RTL) languages with Cairo font support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration and CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/`
- Utility functions and API client in `client/src/lib/`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Server**: HTTP server with Vite middleware for development
- **API Design**: RESTful API endpoints under `/api/` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

The backend uses a storage abstraction pattern (`IStorage` interface) that allows swapping implementations. Currently uses `DatabaseStorage` class for PostgreSQL operations.

### Data Storage
- **Database**: PostgreSQL (configured via `DATABASE_URL` environment variable)
- **Schema Management**: Drizzle Kit for migrations (`drizzle-kit push`)
- **Schema Location**: `shared/schema.ts` contains all table definitions using Drizzle's type-safe schema builder
- **Validation**: Zod schemas generated from Drizzle schemas via `drizzle-zod`

### Key Data Models
- **Users**: Basic authentication with username/password
- **Insurance Applications**: Comprehensive schema tracking:
  - Identity and owner information
  - Vehicle details (model, year, value, plate)
  - Insurance coverage options
  - Payment information (card details, status)
  - Application workflow status

### Build and Development
- **Development**: `npm run dev` runs the Express server with Vite middleware for hot reloading
- **Production Build**: Custom build script (`script/build.ts`) that:
  - Bundles the frontend with Vite
  - Bundles the server with esbuild, inlining key dependencies for faster cold starts
- **Type Checking**: TypeScript with strict mode, path aliases configured for `@/` (client) and `@shared/` (shared)

## External Dependencies

### Database
- PostgreSQL database required via `DATABASE_URL` environment variable
- Uses `pg` driver with connection pooling
- Session storage via `connect-pg-simple`

### Third-Party Services
- No external API integrations currently configured
- Application supports placeholders for potential integrations (Stripe, OpenAI, Google AI based on build configuration)

### UI Libraries
- Radix UI primitives for accessible components
- Lucide React for icons
- Embla Carousel for carousel functionality
- React Day Picker for calendar/date selection
- CMDK for command palette functionality

### Development Tools
- Replit-specific Vite plugins for development experience (cartographer, dev-banner, runtime-error-modal)
- Custom meta images plugin for OpenGraph tags