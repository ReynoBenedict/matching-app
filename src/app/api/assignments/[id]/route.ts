/**
 * GET /api/assignments/[id]
 * Employee retrieves their assignment detail with full record information
 * Server-side enforces that employee can only access their own assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireEmployee } from '@/lib/auth/authorization';
import { getAssignmentDetail } from '@/lib/services/assignment';

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    // Authenticate user and enforce employee role
    const employee = await requireEmployee();

    const params = await context.params;
    const assignmentId = parseInt(params.id, 10);

    if (isNaN(assignmentId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid assignment ID',
        },
        { status: 400 }
      );
    }

    // Get assignment detail (service enforces ownership)
    const result = await getAssignmentDetail(assignmentId, employee.id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get assignment detail error:', error);

    if (
      error instanceof Error &&
      error.message.includes('Unauthorized')
    ) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message.includes('Forbidden')
    ) {
      return NextResponse.json(
        { success: false, error: 'Employee access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve assignment' },
      { status: 500 }
    );
  }
}
