# Replit MD

## Overview

This is a **multilingual concert program notes** web application for **St. George's Choral Society**. It allows audience members to select their preferred language and view program notes for musical performances. The app includes a public-facing landing page with language selection, program notes viewer, and a password-protected admin dashboard for managing supported languages and content.

The project follows a monorepo structure with a React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
- `client/` — React single-page application (Vite + TypeScript)
- `server/` — Express.js API server (TypeScript, run with tsx)
- `shared/` — Shared code between client and server (schema definitions, route contracts, auth models)
- `migrations/` — Drizzle-generated database migrations

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State/Data**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (burgundy/gold color scheme)
- **Animations**: Framer Motion for page transitions and UI animations
- **Build Tool**: Vite with HMR in development

**Key Pages**:
- `/` — Landing page with language selector
- `/program/:lang` — Program notes in the selected language (supports RTL)
- `/admin` — Admin login (password-based)
- `/admin/dashboard` — Admin panel for managing languages and changing password
- `/admin/content/:lang` — Content editor for managing multiple pieces per language (TipTap rich text editor, reorder/add/delete pieces)

### Backend Architecture
- **Framework**: Express.js on Node.js
- **Language**: TypeScript (executed via tsx in dev, compiled with esbuild for production)
- **API Pattern**: REST API under `/api/*` prefix with Zod validation on inputs
- **Route Contracts**: Shared route definitions in `shared/routes.ts` using Zod schemas — both client and server reference the same contract for type safety
- **Session Management**: express-session with connect-pg-simple (sessions stored in PostgreSQL)
- **Authentication**: Two auth systems:
  1. **Replit Auth** (OpenID Connect via Passport.js) — for user-facing auth via Replit identity
  2. **Admin password auth** — simple bcrypt password check stored in `admin_credentials` table, managed via express-session `isAdmin` flag

### Database
- **Engine**: PostgreSQL
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` and `shared/models/auth.ts`
- **Key Tables**:
  - `sessions` — Express session storage (required for Replit Auth)
  - `users` — User profiles from Replit Auth
  - `admin_credentials` — Single-row table for admin password hash
  - `supported_languages` — Languages available for program notes (code, label, native label, direction, enabled flag, sort order)
  - `program_content` — (Legacy) Program notes content by section and language
  - `program_pieces` — Program pieces with title, composer, notes per language (supports multiple pieces per concert, with pieceOrder, published flag)
  - `content_versions` — Version history for content edits (tracks manual vs AI-generated changes)
  - `tracking_events` — Analytics events (e.g., language selections) with JSONB payload
- **Migrations**: Use `npm run db:push` (drizzle-kit push) to sync schema to database

### Storage Layer
- `server/storage.ts` defines an `IStorage` interface with a `DatabaseStorage` implementation
- All database operations go through the `storage` singleton — this pattern allows potential swapping of storage backends

### Build & Deploy
- **Dev**: `npm run dev` — tsx runs the Express server, Vite middleware serves the frontend with HMR
- **Build**: `npm run build` — Vite builds the client to `dist/public/`, esbuild bundles the server to `dist/index.cjs`
- **Production**: `npm start` — runs the compiled server which serves static files from `dist/public/`
- Server build bundles specific dependencies (listed in `script/build.ts` allowlist) to reduce cold start time

## External Dependencies

### Database
- **PostgreSQL** — Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple** — Session storage in PostgreSQL

### Authentication
- **Replit Auth (OpenID Connect)** — Uses `ISSUER_URL` and `REPL_ID` environment variables
- **Passport.js** with openid-client strategy
- **bcryptjs** — Password hashing for admin authentication

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (mandatory)
- `SESSION_SECRET` — Secret for express-session (mandatory)
- `REPL_ID` — Replit environment identifier (set automatically on Replit)
- `ISSUER_URL` — OIDC issuer URL (defaults to `https://replit.com/oidc`)

### Key NPM Packages
- `drizzle-orm` + `drizzle-kit` — Database ORM and migration tooling
- `@tanstack/react-query` — Client-side data fetching and caching
- `zod` + `drizzle-zod` — Runtime validation and schema generation
- `framer-motion` — UI animations
- `wouter` — Client-side routing
- `lucide-react` — Icon library
- Full shadcn/ui component library (Radix UI primitives)
- `@tiptap/react` + `@tiptap/starter-kit` + extensions — Rich text editor for content management
- `dompurify` — HTML sanitization for rendering user-generated content safely
- `openai` — AI translation via Replit AI Integrations (no API key required)

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay in development
- `@replit/vite-plugin-cartographer` — Replit dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Dev environment banner (dev only)