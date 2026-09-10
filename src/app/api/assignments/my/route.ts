/**
 * GET /api/assignments/my
 * Retrieve assignments for the current authenticated employee
 * Requires authentication
 * Server-side enforces that employees can only see their own assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { getEmployeeAssignments } from '@/lib/services/assignment';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Only employees can retrieve assignments for themselves
    if (user.role !== 'EMPLOYEE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only employees can retrieve assignments',
        },
        { status: 403 }
      );
    }

    // Retrieve assignments for this employee (server-side enforced)
    const assignments = await getEmployeeAssignments(user.id);

    return NextResponse.json(
      {
        success: true,
        data: assignments,
        count: assignments.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get my assignments error:', error);

    if (
      error instanceof Error &&
      error.message.includes('Unauthorized')
    ) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve assignments' },
      { status: 500 }
    );
  }
}
