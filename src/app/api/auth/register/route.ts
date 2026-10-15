import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { registrationRequests, users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { recordAuditLog } from '@/lib/audit';
import { and, eq, or } from 'drizzle-orm';

/** SRS SMD-F-01-02: format email divalidasi di server, bukan hanya di formulir. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public registration is restricted to employee accounts only.
 * The role is fixed server-side so it cannot be escalated via the request body.
 */
const REGISTRATION_ROLE = 'EMPLOYEE';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { fullName, email, username, password } = body;

    // Validate input
    if (!fullName || !email || !username || !password) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      );
    }

    // Trim inputs
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (
      !trimmedFullName ||
      !trimmedEmail ||
      !trimmedUsername ||
      !trimmedPassword
    ) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // SRS skenario registrasi 4c: username (atau email) yang sudah dipakai akun
    // aktif maupun permohonan yang masih menunggu verifikasi tidak dapat diajukan lagi.
    const db = getDatabase();
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.username, trimmedUsername), eq(users.email, trimmedEmail)))
      .limit(1);
    const [pendingRequest] = await db
      .select({ id: registrationRequests.id })
      .from(registrationRequests)
      .where(
        and(
          eq(registrationRequests.status, 'PENDING'),
          or(
            eq(registrationRequests.username, trimmedUsername),
            eq(registrationRequests.email, trimmedEmail)
          )
        )
      )
      .limit(1);
    if (existingUser || pendingRequest) {
      return NextResponse.json(
        { error: 'Username atau email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(trimmedPassword);

    // Insert into registration_requests table
    const result = await db.insert(registrationRequests).values({
      fullName: trimmedFullName,
      email: trimmedEmail,
      username: trimmedUsername,
      requestedRole: REGISTRATION_ROLE,
      passwordHash,
      status: 'PENDING',
    }).returning({ id: registrationRequests.id });

    // Record audit log
    if (result.length > 0) {
      await recordAuditLog({
        action: 'REGISTRATION_SUBMITTED',
        entityType: 'registration_request',
        entityId: result[0].id,
        metadata: {
          email: trimmedEmail,
          username: trimmedUsername,
          requestedRole: REGISTRATION_ROLE,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Pengajuan registrasi berhasil dikirim. Silakan tunggu verifikasi dari administrator.',
        registrationId: result[0]?.id,
        email: trimmedEmail,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Check for unique constraint violations
    if (
      error instanceof Error &&
      error.message.includes('unique constraint')
    ) {
      return NextResponse.json(
        { error: 'Username atau email sudah terdaftar' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
