/**
 * GET /api/kepala-bps/hasil-akhir
 * Read-only final verification results for Kepala BPS, built from persisted
 * assignments/verifications. Requires the Kepala BPS role.
 *
 * Query params:
 * - verification: ALL | MATCH | NON_MATCH | UNVERIFIED (optional, default ALL)
 * - page: number (optional, default 1)
 * - limit: number (optional, default 20, max 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireKepalaBPS } from '@/lib/auth/authorization';
import { getFinalResults, type VerificationFilter } from '@/lib/services/final-results';

const VALID_FILTERS: VerificationFilter[] = ['ALL', 'MATCH', 'NON_MATCH', 'UNVERIFIED'];

export async function GET(request: NextRequest) {
  try {
    // Enforce Kepala BPS role
    await requireKepalaBPS();

    const searchParams = request.nextUrl.searchParams;
    const verificationParam = (searchParams.get('verification') || 'ALL').toUpperCase();
    const verification = VALID_FILTERS.includes(verificationParam as VerificationFilter)
      ? (verificationParam as VerificationFilter)
      : 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const data = await getFinalResults({
      verification,
      page: Number.isNaN(page) ? 1 : page,
      limit: Number.isNaN(limit) ? 20 : limit,
    });

    return NextResponse.json(
      {
        success: true,
        data: data.rows,
        summary: data.summary,
        pagination: data.pagination,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get hasil akhir error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Kepala BPS access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Gagal memuat hasil akhir' },
      { status: 500 }
    );
  }
}
