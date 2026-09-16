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
import { getMatchingCandidates } from '@/lib/services/matching-results';

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const searchParams = request.nextUrl.searchParams;
    const datasetAId = parseInt(searchParams.get('datasetAId') || '', 10);
    const datasetBId = parseInt(searchParams.get('datasetBId') || '', 10);
    const threshold = parseFloat(searchParams.get('threshold') || '');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)));

    if (!Number.isInteger(datasetAId) || !Number.isInteger(datasetBId) || !Number.isFinite(threshold)) {
      return NextResponse.json({ success: false, error: 'datasetAId, datasetBId, dan threshold wajib diisi.' }, { status: 400 });
    }
    if (datasetAId === datasetBId) {
      return NextResponse.json({ success: false, error: 'Dataset A dan Dataset B harus berbeda.' }, { status: 400 });
    }

    const result = await getMatchingCandidates({ datasetAId, datasetBId, threshold, page, limit });
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.data.rows,
      summary: result.data.summary,
      datasetA: result.data.datasetA,
      datasetB: result.data.datasetB,
      pagination: result.data.pagination,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Get candidates error:', error);
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to retrieve candidates' }, { status: 500 });
  }
}
