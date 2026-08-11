import { NextResponse } from 'next/server';
import { seedTestUsers } from '@/lib/db/seed';

/**
 * Development-only endpoint to seed test users
 * Only available in development environment
 */
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    await seedTestUsers();
    return NextResponse.json(
      { message: 'Test users seeded successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Failed to seed users' },
      { status: 500 }
    );
  }
}
