/**
 * GET /api/superadmin/history
 * Real audit-log history (Riwayat Proses) with filters, summary counts, and
 * pagination. Requires superadmin role.
 *
 * Query params:
 * - action: string (optional) - exact audit_logs.action
 * - userId: number (optional) - filter by acting user
 * - from: YYYY-MM-DD (optional) - inclusive start date
 * - to: YYYY-MM-DD (optional) - inclusive end date
 * - page: number (optional, default 1)
 * - limit: number (optional, default 10, max 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, UserRole } from '@/lib/auth/authorization';
import { getHistory } from '@/lib/services/history';

export async function GET(request: NextRequest) {
  try {
    // SRS SMD-F-13-01 (Kepala BPS): riwayat proses dapat dipantau oleh Superadmin
    // dan Kepala BPS. Endpoint ini hanya-baca, sehingga akses Kepala BPS tetap read-only.
    const user = await requireAuth();
    if (user.role !== UserRole.SUPERADMIN && user.role !== UserRole.KEPALA_BPS) {
      throw new Error('Forbidden: Superadmin or Kepala BPS access required');
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || undefined;
    const userIdRaw = searchParams.get('userId');
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const userId = userIdRaw ? parseInt(userIdRaw, 10) : undefined;

    const data = await getHistory({
      action,
      userId: userId !== undefined && !Number.isNaN(userId) ? userId : undefined,
      from,
      to,
      page: Number.isNaN(page) ? 1 : page,
      limit: Number.isNaN(limit) ? 10 : limit,
    });

    return NextResponse.json(
      {
        success: true,
        data: data.entries,
        summary: data.summary,
        pagination: data.pagination,
        filters: data.filters,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get history error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Superadmin or Kepala BPS access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Gagal memuat riwayat proses' },
      { status: 500 }
    );
  }
}
