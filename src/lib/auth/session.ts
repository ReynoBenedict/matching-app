import { cookies } from 'next/headers';
import { getDatabase } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const SESSION_COOKIE_NAME = 'auth-session';
const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

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
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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

    const sessionData: SessionData = JSON.parse(sessionCookie.value);

    // Validate that userId exists and is a number
    if (!sessionData.userId || typeof sessionData.userId !== 'number') {
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
  cookieStore.delete(SESSION_COOKIE_NAME);
}
