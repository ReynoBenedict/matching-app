import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan kata sandi harus diisi' },
        { status: 400 }
      );
    }

    // Trim inputs
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      return NextResponse.json(
        { error: 'Username dan kata sandi harus diisi' },
        { status: 400 }
      );
    }

    // Query user by username (or email if it looks like an email)
    const db = getDatabase();
    const userQuery = await db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
        status: users.status,
      })
      .from(users)
      .where(eq(users.username, trimmedUsername))
      .limit(1);

    // User not found or not ACTIVE
    if (userQuery.length === 0) {
      return NextResponse.json(
        { error: 'Username atau kata sandi salah' },
        { status: 401 }
      );
    }

    const user = userQuery[0];

    // Check if user is ACTIVE
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Akun Anda tidak aktif. Hubungi administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      trimmedPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Username atau kata sandi salah' },
        { status: 401 }
      );
    }

    // Password is valid - create session
    await createSession(user.id);

    return NextResponse.json(
      { 
        success: true,
        message: 'Login berhasil'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
