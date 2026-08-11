import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireSuperadmin } from '@/lib/auth/authorization';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Verify Superadmin access
    await requireSuperadmin();

    const db = getDatabase();

    // Fetch active users
    const activeUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        username: users.username,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.status, 'ACTIVE'))
      .orderBy(users.createdAt);

    return NextResponse.json(
      {
        success: true,
        data: activeUsers,
        count: activeUsers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get users error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: 'Forbidden: Superadmin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
