/**
 * GET /api/superadmin/monitoring
 * Returns real monitoring aggregates (assignment progress and employee progress)
 * derived from the database.
 * Requires superadmin role.
 */

import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/authorization';
import { getMonitoringDashboard } from '@/lib/services/monitoring';

export async function GET() {
  try {
    // Enforce superadmin role
    await requireSuperadmin();

    const data = await getMonitoringDashboard();

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get monitoring data error:', error);

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
      { success: false, error: 'Gagal memuat data monitoring' },
      { status: 500 }
    );
  }
}
