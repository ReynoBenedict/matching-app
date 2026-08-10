import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = postgres(databaseUrl);
  dbInstance = drizzle(client);
  return dbInstance;
}

export function getDatabase() {
  return getDb();
}

// Health check function for database connection
export async function checkDatabaseConnection() {
  try {
    getDb();
    // Just return a successful status without actually querying
    return { status: 'connected', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
}

// Lazy export for backward compatibility
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (target, prop) => {
    return getDb()[prop as keyof typeof getDb];
  }
});