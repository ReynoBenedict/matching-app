# BPS Data Matching System

Sistem Pencocokan Data untuk Badan Pusat Statistik (BPS) Kota Malang

## Project Overview

This is an internal web application for BPS Kota Malang to manage and perform data matching operations. The system will support user management, dataset handling, automated data matching, manual verification, and comprehensive reporting.

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling and design system

### Backend  
- **Next.js API Routes** - Backend API endpoints
- **Drizzle ORM** - Database ORM
- **PostgreSQL 16** - Primary database

### Development & Deployment
- **Docker & Docker Compose** - Containerization
- **ESLint** - Code linting
- **TypeScript** - Static type checking

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │ ── │   PostgreSQL    │    │  Model Service  │
│  (Frontend +    │    │   Database      │    │  (Placeholder)  │
│   Backend API)  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Current Status: Phase 1 - Project Foundation

**✅ COMPLETED:**
- [x] Next.js project setup with TypeScript
- [x] Tailwind CSS configuration with BPS color scheme
- [x] Drizzle ORM setup and configuration
- [x] PostgreSQL Docker container configuration
- [x] Docker Compose multi-service setup
- [x] Environment variable configuration
- [x] Basic project structure
- [x] Development tooling (ESLint, TypeScript)
- [x] Stitch UI inventory and preservation

**❌ NOT IMPLEMENTED (Future Phases):**
- Authentication and authorization
- User management system
- Dataset upload and management
- Data matching algorithms
- Assignment and labeling system
- Monitoring and progress tracking
- Reporting and statistics
- Business logic and database schema

## Prerequisites

- **Node.js** 20+ 
- **Docker** and **Docker Compose**
- **Git**

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bps-data-matching-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql://bps_user:bps_password@localhost:5432/bps_data_matching

# Model Service Configuration (Placeholder)
MODEL_SERVICE_URL=http://localhost:8000

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Development Configuration
NODE_ENV=development
```

For Docker development, use the service names:
```env
DATABASE_URL=postgresql://bps_user:bps_password@postgres:5432/bps_data_matching
MODEL_SERVICE_URL=http://model:8000
```

## Running Locally (Development)

1. **Start the database**
   ```bash
   docker compose up postgres -d
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   - Application: http://localhost:3000
   - Database: localhost:5432

## Running with Docker Compose

1. **Build and start all services**
   ```bash
   docker compose up --build
   ```

2. **Run in detached mode**
   ```bash
   docker compose up -d
   ```

3. **Stop services**
   ```bash
   docker compose down
   ```

4. **Stop and remove volumes**
   ```bash
   docker compose down -v
   ```

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build production application
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript checking

# Database (Future use)
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply database migrations  
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

## Project Structure

```
bps-data-matching-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   ├── components/            # React components (future)
│   └── lib/
│       └── db/                # Database configuration
│           ├── index.ts       # Drizzle setup
│           └── schema.ts      # Database schema (placeholder)
├── public/                    # Static assets
├── stitch_bps_data_linkage_system/  # UI design reference
├── docs/                      # Documentation
│   └── stitch-inventory.md    # Stitch UI catalog
├── docker-compose.yml         # Multi-service configuration
├── Dockerfile                 # App container definition
├── drizzle.config.ts         # Drizzle ORM configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Docker Services

### App Container
- **Image:** Node.js 20 Alpine
- **Port:** 3000
- **Purpose:** Next.js application (frontend + backend)

### PostgreSQL Container  
- **Image:** PostgreSQL 16 Alpine
- **Port:** 5432
- **Volume:** `postgres_data` (persistent storage)
- **Database:** `bps_data_matching`
- **User:** `bps_user`

### Model Service (Placeholder)
- **Status:** Not implemented in Phase 1
- **Purpose:** Future data matching algorithms
- **Integration:** Will be added in later phases

## Phase 1 Validation

To verify the foundation is working correctly:

1. **Build check**
   ```bash
   npm run build
   ```

2. **Lint check**
   ```bash
   npm run lint
   ```

3. **Type check**
   ```bash
   npm run type-check
   ```

4. **Docker build**
   ```bash
   docker compose build
   ```

5. **Full stack test**
   ```bash
   docker compose up -d
   # Verify app at http://localhost:3000
   # Verify database connection
   docker compose down
   ```

## Reference Materials

### Stitch UI Design System
The `/stitch_bps_data_linkage_system/` directory contains HTML mockups exported from the design system. These serve as reference material for future UI implementation phases.

**Key Design Elements:**
- BPS blue color palette (#002b5a primary, #006493 secondary)
- Material Design principles
- Responsive layouts
- Indonesian language interface
- Public Sans typography
- Material Symbols icons

See `docs/stitch-inventory.md` for a complete catalog of available screens.

## Development Notes

- **No Business Logic:** Phase 1 contains NO business functionality
- **Database Schema:** Only connection setup, no tables defined yet  
- **Authentication:** Not implemented - will be added in Phase 2
- **Model Service:** Placeholder only - actual ML implementation in future phases
- **UI Components:** Stitch designs preserved but not yet converted to React

## Next Steps (Phase 2+)

1. **Database Schema Design** - Define tables for users, datasets, matching jobs
2. **Authentication System** - Implement login/registration based on Stitch designs  
3. **User Management** - Role-based access control (Admin, Officer, Executive)
4. **Dataset Management** - Upload, preview, and manage data files
5. **Matching Configuration** - Configure and execute data matching jobs
6. **Verification System** - Manual labeling and verification workflows
7. **Monitoring Dashboard** - Track progress and system status
8. **Reporting System** - Generate statistical reports and exports

## Troubleshooting

### Common Issues

**Docker build fails:**
- Ensure Docker is running
- Check available disk space
- Verify Node.js version in Dockerfile

**Database connection errors:**
- Verify PostgreSQL container is running
- Check environment variables
- Ensure port 5432 is not in use

**Next.js build errors:**
- Run `npm run type-check` to identify TypeScript issues
- Run `npm run lint` to fix code style issues
- Clear `.next` folder and rebuild

**Port conflicts:**
- Application (3000): Change in docker-compose.yml
- PostgreSQL (5432): Modify ports mapping in docker-compose.yml

## Contact

BPS Kota Malang Development Team

---

**Phase 1 Status: ✅ COMPLETE**
Foundation is ready for business logic implementation.
