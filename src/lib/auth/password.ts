import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcryptjs
 * @param password - The plaintext password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }
  return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a hash
 * @param password - The plaintext password to verify
 * @param passwordHash - The hash to compare against
 * @returns True if the password matches the hash, false otherwise
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  if (!password || !passwordHash) {
    return false;
  }
  return bcryptjs.compare(password, passwordHash);
}
