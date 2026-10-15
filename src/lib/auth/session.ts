import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getDatabase } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const SESSION_COOKIE_NAME = 'auth-session';
const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Atribut `Secure` membuat peramban menolak cookie pada koneksi HTTP biasa.
 * Aplikasi ini dipakai secara lokal/LAN tanpa HTTPS, sehingga `Secure` hanya
 * dipasang bila aplikasi memang diakses lewat HTTPS (NEXTAUTH_URL diawali
 * https://) atau dipaksa lewat SESSION_COOKIE_SECURE=true.
 */
function cookieSecure(): boolean {
  if (process.env.SESSION_COOKIE_SECURE === 'true') return true;
  if (process.env.SESSION_COOKIE_SECURE === 'false') return false;
  return (process.env.NEXTAUTH_URL ?? '').trim().toLowerCase().startsWith('https://');
}

/**
 * Secret used to sign the session cookie (HMAC-SHA256) so its content cannot be
 * altered by the client. Taken from NEXTAUTH_SECRET (already present in .env) or
 * SESSION_SECRET. When neither is configured, a random per-process secret is used:
 * login keeps working, but sessions end when the server restarts.
 */
const globalSecret = globalThis as typeof globalThis & { __bpsSessionSecret?: string };

function sessionSecret(): string {
  const configured = (process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET || '').trim();
  if (configured) return configured;
  if (!globalSecret.__bpsSessionSecret) {
    globalSecret.__bpsSessionSecret = randomBytes(32).toString('hex');
    console.warn('NEXTAUTH_SECRET/SESSION_SECRET tidak diset: memakai secret sesi acak per proses.');
  }
  return globalSecret.__bpsSessionSecret;
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

/** Encode session data as `<base64url payload>.<signature>`. */
export function encodeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** Decode and verify a session cookie value; returns null when missing, malformed or tampered. */
export function decodeSession(value: string): SessionData | null {
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1), 'base64url');
  const expected = Buffer.from(sign(payload), 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionData;
  } catch {
    return null;
  }
}

/**
 * User session object stored in cookie (user ID only, verified server-side)
 */
export interface SessionData {
  userId: number;
  createdAt: number;
}

/**
 * Create an authenticated session by setting a secure HTTP-only cookie
 * @param userId - The ID of the authenticated user
 */
export async function createSession(userId: number): Promise<void> {
  const sessionData: SessionData = {
    userId,
    createdAt: Date.now(),
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(sessionData), {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Get the current authenticated user session
 * @returns The authenticated user object or null if not authenticated
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    // Reject unsigned or tampered cookies before trusting the user ID inside
    const sessionData = decodeSession(sessionCookie.value);

    // Validate that userId exists and is a number
    if (!sessionData || !sessionData.userId || typeof sessionData.userId !== 'number') {
      return null;
    }

    // Fetch user from database to verify they still exist and are active
    const db = getDatabase();
    const user = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        username: users.username,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, sessionData.userId))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    // Verify user is ACTIVE
    if (user[0].status !== 'ACTIVE') {
      return null;
    }

    return user[0];
  } catch {
    return null;
  }
}

/**
 * Destroy the current authenticated session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  // Explicitly set maxAge to 0 to ensure cookie is deleted
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
