/**
 * GET /api/kepala-bps/dashboard
 * Read-only executive dashboard data for Kepala BPS.
 * Every value is derived from existing database data.
 * Requires the Kepala BPS role.
 */

import { NextResponse } from 'next/server';
import { requireKepalaBPS } from '@/lib/auth/authorization';
import { getKepalaDashboard } from '@/lib/services/kepala-dashboard';

export async function GET() {
  try {
    // Enforce Kepala BPS role
    await requireKepalaBPS();

    const data = await getKepalaDashboard();

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get kepala dashboard error:', error);

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
      { success: false, error: 'Gagal memuat dashboard' },
      { status: 500 }
    );
  }
}
