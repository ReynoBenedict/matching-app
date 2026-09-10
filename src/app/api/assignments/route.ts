/**
 * POST /api/assignments
 * Create a new assignment linking a matching candidate pair to an employee
 * Requires superadmin role
 *
 * Request body:
 * {
 *   recordAId: number,
 *   recordBId: number,
 *   employeeId: number,
 *   similarityScore: number (0-1)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/authorization';
import { createAssignment } from '@/lib/services/assignment';

export async function POST(request: NextRequest) {
  try {
    // Enforce superadmin role
    const superadmin = await requireSuperadmin();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (
      typeof body.recordAId !== 'number' ||
      typeof body.recordBId !== 'number' ||
      typeof body.employeeId !== 'number' ||
      typeof body.similarityScore !== 'number'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request. Required: recordAId, recordBId, employeeId, similarityScore (all numbers)',
        },
        { status: 400 }
      );
    }

    // Prevent self-assignment (record pair must be different)
    if (body.recordAId === body.recordBId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot assign a record to itself',
        },
        { status: 400 }
      );
    }

    // Create assignment with superadmin as creator
    const result = await createAssignment({
      recordAId: body.recordAId,
      recordBId: body.recordBId,
      employeeId: body.employeeId,
      similarityScore: body.similarityScore,
      createdBy: superadmin.id,
    });

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
        assignmentId: result.assignmentId,
        message: 'Assignment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create assignment error:', error);

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
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
