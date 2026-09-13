# Development Guide

This guide covers local development workflow, testing, debugging, and common tasks for the BPS Data Matching System.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Running Tests](#running-tests)
3. [Linting and Formatting](#linting-and-formatting)
4. [Database Work](#database-work)
5. [Debugging](#debugging)
6. [Hot Reload & Dev Server](#hot-reload--dev-server)
7. [API Development](#api-development)
8. [Performance Tips](#performance-tips)

## Local Development Setup

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Start PostgreSQL
docker-compose up -d postgres

# 4. Run migrations
npm run db:push

# 5. Seed test data
npm run db:seed

# 6. Start dev server
npm run dev
```

### After Pulling Changes

```bash
# Install new dependencies
npm install

# Run any new migrations
npm run db:push

# Start dev server
npm run dev
```

## Running Tests

### Unit & Integration Tests

```bash
# Run API tests
npm run test

# Run UI tests
npm run test:ui

# Run employee labeling tests
npm run test:labeling
```

### End-to-End Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run tests matching a pattern
npx playwright test --grep "login"

# Debug tests (opens debug inspector)
npx playwright test --debug
```

### Test Structure

- **Unit Tests**: `src/**/__tests__/*.test.ts`
- **E2E Tests**: `tests/**/*.spec.ts`
- Test files use TypeScript and Playwright/tsx

### Writing New Tests

```typescript
// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test('example test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const title = await page.title();
  expect(title).toBe('BPS Data Matching System');
});
```

Run with: `npm run test:e2e`

## Linting and Formatting

### Check for Issues

```bash
# Run ESLint
npm run lint

# Show detailed output
npm run lint -- --format=verbose
```

### Fix Issues Automatically

```bash
# Fix all auto-fixable issues
npm run lint:fix
```

### Type Checking

```bash
# Check TypeScript types
npm run type-check

# Watch mode for development
npx tsc --watch --noEmit
```

### Pre-commit Recommendations

Before pushing changes:

```bash
# Run all checks
npm run lint:fix
npm run type-check
npm run build
npm run test
```

## Database Work

### Viewing Data

**Visual Editor** (Recommended for development):
```bash
npm run db:studio
# Opens http://localhost:5555 with visual DB editor
```

**Direct Queries** with psql:
```bash
docker-compose exec postgres psql -U bps_user -d bps_data_matching
```

### Schema Changes

When modifying `src/lib/db/schema.ts`:

```bash
# Generate migration file
npm run db:generate

# Review the generated SQL in drizzle/
# Then push to database
npm run db:push

# Or rollback last migration
npm run db:migrate -- --revert
```

### Resetting Database

**WARNING**: This deletes all data!

```bash
# Option 1: Drop volume and restart
docker-compose down -v
docker-compose up -d postgres
npm run db:push
npm run db:seed

# Option 2: Clean SQL
docker-compose exec postgres psql -U bps_user -d bps_data_matching
# Then: DROP SCHEMA public CASCADE; CREATE SCHEMA public;
npm run db:push
npm run db:seed
```

### Database Backup

```bash
# Export database
docker-compose exec postgres pg_dump -U bps_user bps_data_matching > backup.sql

# Restore from backup
docker-compose exec postgres psql -U bps_user bps_data_matching < backup.sql
```

## Debugging

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "skipFiles": ["<node_internals>/**"],
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

Then press `F5` to debug.

### Console Logging

```typescript
// In API routes
console.log('[DEBUG]', { userId, assignmentId });

// In components
console.error('[ERROR]', error.message);
```

View logs in:
- Terminal (for server logs)
- Browser DevTools Console (for client logs)
- `docker-compose logs app` (for Docker)

### Network Debugging

```bash
# View API requests in browser DevTools
# Press F12 → Network tab → Make a request

# Check request details:
# - Status code
# - Response body
# - Request headers
```

### Common Issues

**"Hydration mismatch" error**:
- Caused by server/client rendering differences
- Check `useEffect` for client-only logic
- Use `<Suspense>` boundary if needed

```typescript
// ❌ Wrong - renders differently on server
export default function Component() {
  return <div>{new Date().toISOString()}</div>;
}

// ✅ Correct - client-only
'use client';
import { useEffect, useState } from 'react';

export default function Component() {
  const [time, setTime] = useState('');
  useEffect(() => {
    setTime(new Date().toISOString());
  }, []);
  return <div>{time}</div>;
}
```

## Hot Reload & Dev Server

### Dev Server

```bash
npm run dev
# Starts on http://localhost:3000
# Auto-reloads on file changes
```

### If Hot Reload Isn't Working

1. **Check terminal** - dev server should show rebuild messages
2. **Clear cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```
3. **Hard refresh browser**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
4. **Restart dev server**: Stop and run `npm run dev` again
5. **Check file changes**: Ensure you're editing files in the right location

### Building for Production

```bash
# Build the app
npm run build

# Start production server
npm run start

# Runs on http://localhost:3000
```

## API Development

### Creating New API Routes

API routes go in `src/app/api/`:

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello' });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  // Process data
  return NextResponse.json({ success: true }, { status: 201 });
}
```

### Testing APIs

```bash
# Using curl
curl http://localhost:3000/api/example

# Using fetch in DevTools Console
fetch('/api/example')
  .then(r => r.json())
  .then(console.log)
```

### Error Handling

```typescript
export async function GET(request: NextRequest) {
  try {
    // Your logic
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Performance Tips

### Monitoring Build Time

```bash
# See which parts take longest to build
ANALYZE=true npm run build
```

### Database Query Optimization

```typescript
// ❌ Slow - N+1 queries
const records = await db.select().from(dataset_records);
for (const record of records) {
  const assignments = await db.select().from(assignments)
    .where(eq(assignments.record_a_id, record.id));
}

// ✅ Fast - Single query with join
const data = await db
  .select()
  .from(dataset_records)
  .leftJoin(assignments, eq(dataset_records.id, assignments.record_a_id));
```

### Image Optimization

```typescript
// ✅ Use Next.js Image component
import Image from 'next/image';

export default function Profile() {
  return (
    <Image
      src="/avatar.jpg"
      alt="User"
      width={200}
      height={200}
      priority // For above-the-fold images
    />
  );
}
```

### Component Optimization

```typescript
// ✅ Memoize expensive components
import { memo } from 'react';

const ExpensiveComponent = memo(function Component({ data }) {
  return <div>{data}</div>;
});

export default ExpensiveComponent;
```

## Common Development Tasks

### Adding a New Field to Database

1. Update schema in `src/lib/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `drizzle/`
4. Push to database: `npm run db:push`
5. Update API handlers to use new field
6. Add tests

### Adding Authentication to New Route

```typescript
// src/app/api/protected/route.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Session available - use session.user
  return NextResponse.json({ user: session.user });
}
```

### Debugging Database Connection

```bash
# Test connection string
DATABASE_URL="postgresql://bps_user:bps_password@localhost:5432/bps_data_matching" \
npm run db:push

# View connection details
echo $DATABASE_URL
```

### Viewing Server Request/Response

```typescript
// In API route
export async function POST(request: NextRequest) {
  console.log('[REQUEST]', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers),
  });

  const body = await request.json();
  console.log('[BODY]', body);

  const response = NextResponse.json({ success: true });
  console.log('[RESPONSE]', response.status);
  
  return response;
}
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Getting Help

- Check existing tests for examples: `tests/`, `src/**/__tests__/`
- Review API implementations: `src/app/api/`
- Ask team members in PRs
- Check git history: `git log --oneline`
