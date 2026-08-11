import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { registrationRequests, users } from '@/lib/db/schema';
import { requireSuperadmin } from '@/lib/auth/authorization';
import { eq } from 'drizzle-orm';
import { recordAuditLog } from '@/lib/audit';

/**
 * GET /api/superadmin/registration-requests/[id]
 * Get a specific registration request details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify Superadmin access
    await requireSuperadmin();

    const db = getDatabase();
    const { id } = await params;
    const requestId = parseInt(id, 10);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    const regRequest = await db
      .select()
      .from(registrationRequests)
      .where(eq(registrationRequests.id, requestId))
      .limit(1);

    if (regRequest.length === 0) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: regRequest[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get registration request error:', error);

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

/**
 * POST /api/superadmin/registration-requests/[id]/approve
 * Approve a registration request (embedded in route params)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify Superadmin access
    const superadmin = await requireSuperadmin();

    const db = getDatabase();
    const { id } = await params;
    const requestId = parseInt(id, 10);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action } = body;

    // Get the registration request
    const regRequest = await db
      .select()
      .from(registrationRequests)
      .where(eq(registrationRequests.id, requestId))
      .limit(1);

    if (regRequest.length === 0) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const req = regRequest[0];

    // Prevent invalid state transitions
    if (req.status !== 'PENDING') {
      return NextResponse.json(
        {
          error: `Cannot ${action} a ${req.status} registration request`,
        },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Check if user already exists with same email/username
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, req.email))
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }

      // Create active user
      const newUser = await db
        .insert(users)
        .values({
          fullName: req.fullName,
          email: req.email,
          username: req.username,
          passwordHash: req.passwordHash,
          role: req.requestedRole,
          status: 'ACTIVE',
        })
        .returning({ id: users.id });

      // Update registration request status
      await db
        .update(registrationRequests)
        .set({
          status: 'APPROVED',
          reviewedBy: superadmin.id,
          reviewedAt: new Date(),
        })
        .where(eq(registrationRequests.id, requestId));

      // Record audit log
      await recordAuditLog({
        userId: superadmin.id,
        action: 'REGISTRATION_APPROVED',
        entityType: 'registration_request',
        entityId: requestId,
        metadata: {
          email: req.email,
          username: req.username,
          role: req.requestedRole,
          newUserId: newUser[0]?.id,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Registrasi disetujui',
          data: {
            registrationId: requestId,
            userId: newUser[0]?.id,
          },
        },
        { status: 200 }
      );
    } else if (action === 'reject') {
      const { reason } = body;

      // Update registration request status
      await db
        .update(registrationRequests)
        .set({
          status: 'REJECTED',
          reviewedBy: superadmin.id,
          reviewedAt: new Date(),
          rejectionReason: reason || null,
        })
        .where(eq(registrationRequests.id, requestId));

      // Record audit log
      await recordAuditLog({
        userId: superadmin.id,
        action: 'REGISTRATION_REJECTED',
        entityType: 'registration_request',
        entityId: requestId,
        metadata: {
          email: req.email,
          username: req.username,
          reason: reason || null,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Registrasi ditolak',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Registration request action error:', error);

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
