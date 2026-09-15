/**
 * GET /api/superadmin/matching-results
 * Returns ALL candidates produced by the matching process for a dataset pair and
 * threshold, merged with stored assignment/verification data.
 * Requires superadmin role.
 *
 * Query params:
 * - datasetAId: number (required)
 * - datasetBId: number (required)
 * - threshold: number (required, 0-1)
 * - page: number (optional, default 1)
 * - limit: number (optional, default 20, max 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/authorization';
import { getMatchingCandidates } from '@/lib/services/matching-results';

export async function GET(request: NextRequest) {
  try {
    // Enforce superadmin role
    await requireSuperadmin();

    const searchParams = request.nextUrl.searchParams;
    const datasetAId = parseInt(searchParams.get('datasetAId') || '', 10);
    const datasetBId = parseInt(searchParams.get('datasetBId') || '', 10);
    const threshold = parseFloat(searchParams.get('threshold') || '');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (Number.isNaN(datasetAId) || Number.isNaN(datasetBId)) {
      return NextResponse.json(
        { success: false, error: 'Parameter datasetAId dan datasetBId wajib diisi.' },
        { status: 400 }
      );
    }

    if (Number.isNaN(threshold) || threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { success: false, error: 'Threshold harus berupa angka antara 0 dan 1.' },
        { status: 400 }
      );
    }

    const result = await getMatchingCandidates({
      datasetAId,
      datasetBId,
      threshold,
      page: Number.isNaN(page) ? 1 : page,
      limit: Number.isNaN(limit) ? 20 : limit,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data.rows,
        summary: result.data.summary,
        datasetA: result.data.datasetA,
        datasetB: result.data.datasetB,
        threshold: result.data.threshold,
        pagination: result.data.pagination,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get matching results error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Superadmin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Gagal memuat hasil pencocokan' },
      { status: 500 }
    );
  }
}
