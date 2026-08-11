import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { registrationRequests } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { fullName, email, username, requestedRole, password } = body;

    // Validate input
    if (!fullName || !email || !username || !requestedRole || !password) {
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
    const trimmedRole = requestedRole.trim();
    const trimmedPassword = password.trim();

    if (
      !trimmedFullName ||
      !trimmedEmail ||
      !trimmedUsername ||
      !trimmedRole ||
      !trimmedPassword
    ) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(trimmedPassword);

    // Insert into registration_requests table
    const db = getDatabase();
    const result = await db.insert(registrationRequests).values({
      fullName: trimmedFullName,
      email: trimmedEmail,
      username: trimmedUsername,
      requestedRole: trimmedRole,
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
          requestedRole: trimmedRole,
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
