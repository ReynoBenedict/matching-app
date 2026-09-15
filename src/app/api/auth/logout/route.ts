import { NextResponse } from 'next/server';
import { destroySession, getAuthenticatedUser } from '@/lib/auth/session';
import { recordAuditLog } from '@/lib/audit';

export async function POST() {
  try {
    // Capture the user before the session is destroyed
    const user = await getAuthenticatedUser();

    if (user) {
      // Record real activity for Riwayat Proses
      await recordAuditLog({
        userId: user.id,
        action: 'LOGOUT',
        entityType: 'user',
        entityId: user.id,
      });
    }

    // Destroy the session
    await destroySession();

    // Create response with explicit cookie deletion
    const response = NextResponse.json(
      { 
        success: true,
        message: 'Logout berhasil'
      },
      { status: 200 }
    );

    // Ensure cookie is cleared in response headers
    response.cookies.delete('auth-session');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
