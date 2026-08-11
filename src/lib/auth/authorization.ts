
import { getAuthenticatedUser } from '@/lib/auth/session';

/**
 * User roles in the system
 */
export enum UserRole {
  SUPERADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  KEPALA_BPS = 'HEAD',
}

/**
 * Get the current authenticated user or throw an error if not authenticated
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }
  return user;
}

/**
 * Check if the current user is a Superadmin
 */
export async function isSuperadmin(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user?.role === UserRole.SUPERADMIN;
}

/**
 * Check if the current user is an Employee
 */
export async function isEmployee(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user?.role === UserRole.EMPLOYEE;
}

/**
 * Check if the current user is a Kepala BPS
 */
export async function isKepalaBPS(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user?.role === UserRole.KEPALA_BPS;
}

/**
 * Verify that the current user is a Superadmin or throw an error
 */
export async function requireSuperadmin() {
  const user = await requireAuth();
  if (user.role !== UserRole.SUPERADMIN) {
    throw new Error('Forbidden: Superadmin access required');
  }
  return user;
}

/**
 * Verify that the current user is an Employee or throw an error
 */
export async function requireEmployee() {
  const user = await requireAuth();
  if (user.role !== UserRole.EMPLOYEE) {
    throw new Error('Forbidden: Employee access required');
  }
  return user;
}

/**
 * Verify that the current user is Kepala BPS or throw an error
 */
export async function requireKepalaBPS() {
  const user = await requireAuth();
  if (user.role !== UserRole.KEPALA_BPS) {
    throw new Error('Forbidden: Kepala BPS access required');
  }
  return user;
}
