import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { registrationRequests } from '@/lib/db/schema';
import { requireSuperadmin } from '@/lib/auth/authorization';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Verify Superadmin access
    await requireSuperadmin();

    const db = getDatabase();

    // Get query parameters
    const status = request.nextUrl.searchParams.get('status') || 'PENDING';

    // Fetch registration requests
    const requests = await db
      .select()
      .from(registrationRequests)
      .where(eq(registrationRequests.status, status))
      .orderBy(registrationRequests.createdAt);

    return NextResponse.json(
      {
        success: true,
        data: requests,
        count: requests.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get registration requests error:', error);

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
