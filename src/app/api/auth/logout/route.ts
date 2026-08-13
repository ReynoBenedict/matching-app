import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export async function POST() {
  try {
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
