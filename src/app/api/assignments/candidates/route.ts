/**
 * GET /api/assignments/candidates
 * Retrieve matching candidates for the superadmin to assign to employees
 * This endpoint reuses the matching API result to retrieve candidates
 * Requires superadmin role
 *
 * Query params:
 * - datasetAId: number (required) - First dataset ID
 * - datasetBId: number (required) - Second dataset ID
 * - columnMappings: JSON string (required) - Column mapping configuration
 * - threshold: number (required) - Matching threshold (0-1)
 * - page: number (optional, default 1) - Pagination page
 * - limit: number (optional, default 10, max 100) - Results per page
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/authorization';
import { getMatchingProvider } from '@/lib/services/matching';
import type { MatchingRequest } from '@/lib/services/matching/provider';
import { getDatabase } from '@/lib/db';
import { assignments, datasetRecords, users } from '@/lib/db/schema';
import { inArray, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Enforce superadmin role
    await requireSuperadmin();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const datasetAId = parseInt(searchParams.get('datasetAId') || '', 10);
    const datasetBId = parseInt(searchParams.get('datasetBId') || '', 10);
    const columnMappingsJson = searchParams.get('columnMappings');
    const threshold = parseFloat(searchParams.get('threshold') || '');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Validate required parameters
    if (!datasetAId || !datasetBId || !columnMappingsJson || !threshold) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: datasetAId, datasetBId, columnMappings (JSON string), threshold',
        },
        { status: 400 }
      );
    }

    if (datasetAId === datasetBId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot match a dataset against itself',
        },
        { status: 400 }
      );
    }

    // Parse column mappings
    let columnMappings;
    try {
      columnMappings = JSON.parse(columnMappingsJson);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid columnMappings JSON',
        },
        { status: 400 }
      );
    }

    // Validate pagination
    const validLimit = Math.min(Math.max(1, limit), 100);
    const validPage = Math.max(1, page);
    const offset = (validPage - 1) * validLimit;

    // Get matching provider and run matching
    const provider = getMatchingProvider();
    const matchingRequest: MatchingRequest = {
      datasetAId,
      datasetBId,
      columnMappings,
      threshold,
    };

    const result = await provider.runMatching(matchingRequest);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to run matching',
        },
        { status: 400 }
      );
    }

    // Apply pagination to candidates
    const candidates = result.data?.candidates || [];
    const paginatedCandidates = candidates.slice(offset, offset + validLimit);

    const db = getDatabase();

    // Attach the underlying record summary (idsbr / nama usaha / wilayah)
    const allRecordIds = [
      ...new Set([
        ...paginatedCandidates.map((c) => c.recordAId),
        ...paginatedCandidates.map((c) => c.recordBId),
      ]),
    ];

    const recordMap = new Map<
      number,
      { idsbr: string; namaUsaha: string; alamatUsaha: string; nmprov: string; nmkab: string }
    >();
    if (allRecordIds.length > 0) {
      const rows = await db
        .select({
          id: datasetRecords.id,
          idsbr: datasetRecords.idsbr,
          namaUsaha: datasetRecords.namaUsaha,
          alamatUsaha: datasetRecords.alamatUsaha,
          nmprov: datasetRecords.nmprov,
          nmkab: datasetRecords.nmkab,
        })
        .from(datasetRecords)
        .where(inArray(datasetRecords.id, allRecordIds));
      for (const row of rows) {
        recordMap.set(row.id, {
          idsbr: row.idsbr,
          namaUsaha: row.namaUsaha,
          alamatUsaha: row.alamatUsaha,
          nmprov: row.nmprov,
          nmkab: row.nmkab,
        });
      }
    }

    // Detect candidates that already have an assignment (cannot be assigned twice)
    const recordAIds = [...new Set(paginatedCandidates.map((c) => c.recordAId))];
    const recordBIds = [...new Set(paginatedCandidates.map((c) => c.recordBId))];

    const assignmentMap = new Map<
      string,
      { assignmentId: number; status: string; employeeId: number }
    >();
    if (recordAIds.length > 0 && recordBIds.length > 0) {
      const existing = await db
        .select({
          id: assignments.id,
          recordAId: assignments.recordAId,
          recordBId: assignments.recordBId,
          status: assignments.status,
          employeeId: assignments.employeeId,
        })
        .from(assignments)
        .where(
          and(
            inArray(assignments.recordAId, recordAIds),
            inArray(assignments.recordBId, recordBIds)
          )
        );

      for (const a of existing) {
        assignmentMap.set(`${a.recordAId}-${a.recordBId}`, {
          assignmentId: a.id,
          status: a.status,
          employeeId: a.employeeId,
        });
      }
    }

    const employeeIds = [...new Set([...assignmentMap.values()].map((a) => a.employeeId))];
    const employeeMap = new Map<number, string>();
    if (employeeIds.length > 0) {
      const employees = await db
        .select({ id: users.id, fullName: users.fullName })
        .from(users)
        .where(inArray(users.id, employeeIds));
      for (const e of employees) {
        employeeMap.set(e.id, e.fullName);
      }
    }

    const enriched = paginatedCandidates.map((candidate) => {
      const existing = assignmentMap.get(`${candidate.recordAId}-${candidate.recordBId}`);
      return {
        ...candidate,
        recordA: recordMap.get(candidate.recordAId) ?? null,
        recordB: recordMap.get(candidate.recordBId) ?? null,
        assigned: Boolean(existing),
        assignmentId: existing?.assignmentId ?? null,
        assignmentStatus: existing?.status ?? null,
        assignedEmployee: existing
          ? { id: existing.employeeId, fullName: employeeMap.get(existing.employeeId) ?? null }
          : null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: enriched,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: candidates.length,
          totalPages: Math.ceil(candidates.length / validLimit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get candidates error:', error);

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

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve candidates' },
      { status: 500 }
    );
  }
}
