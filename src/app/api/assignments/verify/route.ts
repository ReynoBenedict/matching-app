/**
 * POST /api/assignments/verify
 * Employee saves their verification result (MATCH or NON-MATCH) for an assignment
 * Requires authentication and employee role
 * Server-side enforces that employee can only verify their own assignments
 *
 * Request body:
 * {
 *   assignmentId: number,
 *   verificationResult: 'MATCH' | 'NON_MATCH'
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireEmployee } from '@/lib/auth/authorization';
import { saveVerificationResult } from '@/lib/services/assignment';

export async function POST(request: NextRequest) {
  try {
    // Enforce employee role
    const employee = await requireEmployee();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (
      typeof body.assignmentId !== 'number' ||
      !['MATCH', 'NON_MATCH'].includes(body.verificationResult)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request. Required: assignmentId (number), verificationResult (MATCH|NON_MATCH)',
        },
        { status: 400 }
      );
    }

    // Save verification result (service will enforce ownership)
    const result = await saveVerificationResult(
      body.assignmentId,
      employee.id,
      body.verificationResult
    );

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
        message: `Assignment verified as ${body.verificationResult}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify assignment error:', error);

    if (
      error instanceof Error &&
      (error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden'))
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to save verification result' },
      { status: 500 }
    );
  }
}
