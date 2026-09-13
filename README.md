# BPS Data Matching System

A modern web-based data matching and linkage system for the Indonesian Central Bureau of Statistics (BPS - Badan Pusat Statistik). This system enables efficient matching and verification of business registry records through a collaborative employee verification workflow.

## Status

**Phases 0-6E Complete** ✅

This project has completed all planned phases including:
- Phase 0: Project Setup & Database Schema
- Phase 1: Authentication & Role-Based Access
- Phase 2: Dataset Management & Upload
- Phase 3: Data Matching Algorithm Integration
- Phase 4: Employee Assignment & Labeling UI
- Phase 5: Admin Dashboard & Reporting
- Phase 6: API Testing & Validation
- Phase 6E: End-to-End Testing & Documentation

## Quick Start

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **Docker & Docker Compose** (for database setup)
- **npm** (comes with Node.js)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd matching-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Update `.env` with your configuration (defaults work for local development):

```env
DATABASE_URL=postgresql://bps_user:bps_password@localhost:5432/bps_data_matching
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Start the Database

```bash
docker-compose up -d postgres
```

Wait for PostgreSQL to be healthy:
```bash
docker-compose logs postgres
```

### 5. Run Database Migrations

```bash
npm run db:push
```

### 6. Seed Test Data (Development Only)

Populate the database with 7 test users, 10 dataset records, and 8 assignments:

```bash
npm run db:seed
```

For dataset-only seeding:
```bash
npm run db:seed -- --dataset
```

### 7. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Testing Credentials

After seeding, use these credentials to log in:

| Role | Username | Password | Email |
|------|----------|----------|-------|
| **Super Admin** | `superadmin` | `superadmin123` | `superadmin@bps.go.id` |
| **Admin** | `admin` | `admin123` | `admin@bps.go.id` |
| **Head (Kepala)** | `kepala` | `kepala123` | `kepala@bps.go.id` |
| **Employee 1** | `karyawan1` | `karyawan123` | `karyawan1@bps.go.id` |
| **Employee 2** | `karyawan2` | `karyawan123` | `karyawan2@bps.go.id` |
| **Employee 3** | `karyawan3` | `karyawan123` | `karyawan3@bps.go.id` |
| **Employee (Inactive)** | `karyawan_nonaktif` | `karyawan123` | `karyawan_nonaktif@bps.go.id` |

## Local Development Setup

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed information on:
- Running tests
- Linting and formatting
- Database migrations
- Debugging tips
- Hot reload development

## Docker Setup

### Quick Start with Docker Compose

Run the entire stack (app + PostgreSQL) in Docker:

```bash
docker-compose up
```

This will:
1. Build the Next.js application
2. Start PostgreSQL with persistence
3. Run migrations and seed data automatically
4. Start the app on port 3000

### Database Persistence

PostgreSQL data is persisted in the `postgres_data` volume. To reset:

```bash
docker-compose down -v  # WARNING: Deletes all data
docker-compose up       # Starts fresh
```

### Logs

View application logs:
```bash
docker-compose logs app
```

View database logs:
```bash
docker-compose logs postgres
```

## Database Seeding

### Test Users (7 Total)
- **1 SUPERADMIN** - Full system access
- **1 ADMIN** - Administrative tasks
- **1 HEAD** - Department head/reviewer
- **4 EMPLOYEE** - Data labeling (3 active, 1 inactive)

### Test Data
- **1 Test Dataset** - Business registry data
- **10 Dataset Records** - Individual records with location data
- **8 Assignments** - Distributed across employees with varying statuses:
  - 3 PENDING
  - 2 IN_PROGRESS
  - 3 COMPLETED (with verification results)

Seed data is for development/testing only. Do NOT use in production.

## Project Structure

```
matching-app/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── datasets/         # Dataset management UI
│   │   ├── employee/         # Employee labeling UI
│   │   └── kepala-bps/       # Admin review UI
│   ├── components/           # Reusable React components
│   ├── lib/
│   │   ├── auth/            # Authentication utilities
│   │   ├── db/              # Database schema & seed
│   │   └── utils/           # Helper functions
│   └── middleware.ts        # NextAuth middleware
├── drizzle/                 # Database migrations
├── scripts/                 # Utility scripts
├── tests/                   # E2E tests
├── docker-compose.yml       # Docker configuration
├── Dockerfile              # Container build config
└── package.json            # Dependencies & scripts
```

## Common Troubleshooting

### Database Connection Failed

**Problem**: `ERROR: password authentication failed for user "bps_user"`

**Solution**:
1. Verify `DATABASE_URL` in `.env`
2. Ensure PostgreSQL is running: `docker-compose logs postgres`
3. Restart PostgreSQL: `docker-compose restart postgres`

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**: 
```bash
# Kill the process using port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

### Database Migrations Failed

**Problem**: `Error: column "..." does not exist`

**Solution**:
```bash
npm run db:push --force  # Careful: may drop/recreate tables
```

### Hot Reload Not Working

**Problem**: Changes don't reflect in browser

**Solution**:
1. Check that `npm run dev` is running
2. Clear `.next` cache: `rm -rf .next`
3. Restart dev server

### Seed Data Already Exists

**Problem**: `duplicate key value violates unique constraint`

**Solution**:
The seed script is idempotent - it skips existing users. To reset:
```bash
docker-compose down -v
docker-compose up
npm run db:seed
```

## Team Contribution Guidelines

### Before Starting Work

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Pull latest changes: `git pull origin main`
3. Install dependencies: `npm install`

### During Development

1. Follow the existing code style and structure
2. Keep commits atomic and descriptive
3. Write tests for new functionality
4. Update documentation as needed

### Before Pushing

1. Run linting: `npm run lint:fix`
2. Type check: `npm run type-check`
3. Run tests: `npm run test` and `npm run test:e2e`
4. Build: `npm run build`

### Pull Request Process

1. Push to your feature branch
2. Create a pull request with clear description
3. Reference any related issues (#123)
4. Ensure all checks pass (lint, type-check, tests, build)
5. Request review from team members
6. Address review comments
7. Merge when approved

### Code Standards

- **TypeScript**: Use strict mode, avoid `any`
- **Components**: Use functional components with React hooks
- **Database**: Use Drizzle ORM for queries
- **Styling**: Use Tailwind CSS for UI
- **Testing**: Write tests for business logic
- **Comments**: Document complex logic
- **Git**: Use conventional commits (feat:, fix:, docs:, etc.)

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript type checking
npm run test             # Run assignment tests
npm run test:ui          # Run UI tests
npm run test:labeling    # Run employee labeling tests
npm run test:e2e         # Run Playwright E2E tests
npm run db:generate      # Generate migration files
npm run db:migrate       # Run migrations
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio (visual DB editor)
npm run db:seed          # Seed test data
```

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth for authentication
- **Database**: PostgreSQL 16, Drizzle ORM
- **Testing**: Playwright (E2E), TypeScript
- **DevOps**: Docker, Docker Compose
- **Security**: bcryptjs for password hashing

## Support & Documentation

- See [DEVELOPMENT.md](./DEVELOPMENT.md) for development workflow details
- Database schema is defined in `src/lib/db/schema.ts`
- API documentation available in route files
- Migration history in `drizzle/` directory

## License

Internal use only - BPS Data Matching System

## Contact

For questions or issues, contact the development team.
