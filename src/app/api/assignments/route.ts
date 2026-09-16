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
import { getDatabase } from '@/lib/db';
import { assignments, users, matchingRuns, datasets } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    await requireSuperadmin();
    const db = getDatabase();
    const rows = await db
      .select({
        id: assignments.id,
        matchingRunId: assignments.matchingRunId,
        employeeId: assignments.employeeId,
        employeeName: users.fullName,
        status: assignments.status,
        createdAt: assignments.createdAt,
        verificationResult: assignments.verificationResult,
        datasetAId: matchingRuns.datasetAId,
        datasetBId: matchingRuns.datasetBId,
        datasetAName: datasets.name,
      })
      .from(assignments)
      .leftJoin(users, eq(users.id, assignments.employeeId))
      .leftJoin(matchingRuns, eq(matchingRuns.id, assignments.matchingRunId))
      .leftJoin(datasets, eq(datasets.id, matchingRuns.datasetAId))
      .orderBy(desc(assignments.createdAt))
      .limit(500);

    const datasetIds = [...new Set(rows.flatMap((row) => [row.datasetAId, row.datasetBId]).filter((id): id is number => id != null))];
    const datasetRows = datasetIds.length ? await db.select({ id: datasets.id, name: datasets.name }).from(datasets) : [];
    const names = new Map(datasetRows.map((d) => [d.id, d.name]));

    return NextResponse.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        matchingRunId: row.matchingRunId,
        datasetA: row.datasetAId ? { id: row.datasetAId, name: names.get(row.datasetAId) ?? '-' } : null,
        datasetB: row.datasetBId ? { id: row.datasetBId, name: names.get(row.datasetBId) ?? '-' } : null,
        employee: row.employeeId ? { id: row.employeeId, fullName: row.employeeName ?? '-' } : null,
        assignedAt: row.createdAt.toISOString(),
        status: row.status,
        verificationResult: row.verificationResult,
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 403 });
    }
    console.error('Get assignments error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memuat daftar penugasan.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Enforce superadmin role
    const superadmin = await requireSuperadmin();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (
      typeof body.matchingRunId !== 'number' ||
      typeof body.recordAId !== 'number' ||
      typeof body.recordBId !== 'number' ||
      typeof body.employeeId !== 'number' ||
      typeof body.similarityScore !== 'number'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request. Required: matchingRunId, recordAId, recordBId, employeeId, similarityScore (all numbers)',
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
      matchingRunId: body.matchingRunId,
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
