/**
 * GET /api/reports/summary
 * Real, database-backed report summary.
 * Available to Superadmin (ADMIN) and Kepala BPS (HEAD). Read-only.
 *
 * Query params:
 * - type: ringkasan-pencocokan | kinerja-keseluruhan | kinerja-pegawai
 * - from: YYYY-MM-DD (optional)
 * - to: YYYY-MM-DD (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { generateReport, type ReportTypeKey } from '@/lib/services/report';

const VALID_TYPES: ReportTypeKey[] = [
  'ringkasan-pencocokan',
  'kinerja-keseluruhan',
  'kinerja-pegawai',
];

const ALLOWED_ROLES = ['ADMIN', 'HEAD'];

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Laporan access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get('type') || 'ringkasan-pencocokan';
    const type = VALID_TYPES.includes(typeParam as ReportTypeKey)
      ? (typeParam as ReportTypeKey)
      : 'ringkasan-pencocokan';
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const report = await generateReport({ type, from, to });

    return NextResponse.json({ success: true, data: report }, { status: 200 });
  } catch (error) {
    console.error('Get report error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Gagal membuat laporan' },
      { status: 500 }
    );
  }
}
