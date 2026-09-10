import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getDatabase } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';

/**
 * Seed the database with test users for development
 * RUN THIS ONLY FOR DEVELOPMENT!
 */
export async function seedTestUsers() {
  const db = getDatabase();

  // Test users
  const testUsers = [
    {
      fullName: 'Admin Test',
      email: 'admin@bps.go.id',
      username: 'admin',
      password: 'admin123456',
      role: 'ADMIN',
    },
    {
      fullName: 'Petugas Verifikasi',
      email: 'verifikasi@bps.go.id',
      username: 'petugas_verifikasi',
      password: 'petugas123456',
      role: 'VERIFICATION_OFFICER',
    },
    {
      fullName: 'Kepala BPS',
      email: 'kepala@bps.go.id',
      username: 'kepala',
      password: 'kepala123456',
      role: 'HEAD',
    },
    {
      fullName: 'Employee Test',
      email: 'employee@bps.go.id',
      username: 'employee_test',
      password: 'employee123456',
      role: 'EMPLOYEE',
    },
  ];

  console.log('🌱 Seeding test users...');

  for (const testUser of testUsers) {
    try {
      const passwordHash = await hashPassword(testUser.password);
      
      await db.insert(users).values({
        fullName: testUser.fullName,
        email: testUser.email,
        username: testUser.username,
        passwordHash,
        role: testUser.role,
        status: 'ACTIVE',
      });

      console.log(`✅ Created user: ${testUser.username}`);
    } catch (error) {
      // Check both the top-level message and the nested cause (postgres driver wraps the PG error)
      const isUniqueViolation =
        (error instanceof Error && error.message.includes('unique constraint')) ||
        (error instanceof Error &&
          (error as Error & { cause?: { code?: string } }).cause?.code === '23505');

      if (isUniqueViolation) {
        console.log(`⏭️  User ${testUser.username} already exists, skipping`);
      } else {
        console.error(`❌ Error creating user ${testUser.username}:`, error);
        throw error;
      }
    }
  }

  console.log('✅ Seeding complete!');
}

// Note: This module is imported by the API seed route.
// Do not add top-level auto-execution here — it would fire during Next.js build.