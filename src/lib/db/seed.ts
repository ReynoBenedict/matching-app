import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import postgres from 'postgres';
import { hashPassword } from '@/lib/auth/password';

/**
 * Seed the database with test users for development
 * RUN THIS ONLY FOR DEVELOPMENT!
 * 
 * Creates 7 test users covering roles:
 * - 1 SUPERADMIN
 * - 1 ADMIN
 * - 1 HEAD
 * - 4 EMPLOYEE (3 active, 1 inactive)
 */
export async function seedTestUsers() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = postgres(databaseUrl);

  // Test users - 7 total
  const testUsers = [
    {
      fullName: 'Super Admin',
      email: 'superadmin@bps.go.id',
      username: 'superadmin',
      password: 'superadmin123',
      role: 'SUPERADMIN',
      status: 'ACTIVE' as const,
    },
    {
      fullName: 'Admin Test',
      email: 'admin@bps.go.id',
      username: 'admin',
      password: 'admin123',
      role: 'ADMIN',
      status: 'ACTIVE' as const,
    },
    {
      fullName: 'Kepala BPS',
      email: 'kepala@bps.go.id',
      username: 'kepala',
      password: 'kepala123',
      role: 'HEAD',
      status: 'ACTIVE' as const,
    },
    {
      fullName: 'Karyawan Satu',
      email: 'karyawan1@bps.go.id',
      username: 'karyawan1',
      password: 'karyawan123',
      role: 'EMPLOYEE',
      status: 'ACTIVE' as const,
    },
    {
      fullName: 'Karyawan Dua',
      email: 'karyawan2@bps.go.id',
      username: 'karyawan2',
      password: 'karyawan123',
      role: 'EMPLOYEE',
      status: 'ACTIVE' as const,
    },
    {
      fullName: 'Karyawan Tiga',
      email: 'karyawan3@bps.go.id',
      username: 'karyawan3',
      password: 'karyawan123',
      role: 'EMPLOYEE',
      status: 'ACTIVE' as const,
    },
    {
      fullName: 'Karyawan Nonaktif',
      email: 'karyawan_nonaktif@bps.go.id',
      username: 'karyawan_nonaktif',
      password: 'karyawan123',
      role: 'EMPLOYEE',
      status: 'INACTIVE' as const,
    },
  ];

  console.log('🌱 Seeding test users...');
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const testUser of testUsers) {
    try {
      // Hash the password
      const passwordHash = await hashPassword(testUser.password);

      // Verify hash was generated
      if (!passwordHash || passwordHash.length === 0) {
        throw new Error(`Password hash is empty for ${testUser.username}`);
      }

      console.log(
        `🔐 Generated hash for ${testUser.username}: ${passwordHash.substring(0, 15)}... (length: ${passwordHash.length})`
      );

      // Simple INSERT without ON CONFLICT - handle duplicates with try-catch
      await client`
        INSERT INTO users (full_name, email, username, password_hash, role, status, created_at, updated_at)
        VALUES (${testUser.fullName}, ${testUser.email}, ${testUser.username}, ${passwordHash}, ${testUser.role}, ${testUser.status}, NOW(), NOW())
      `;

      console.log(`✅ Created user: ${testUser.username} (${testUser.role})`);
      createdCount++;
    } catch (error) {
      // Check both the top-level message and the nested cause (postgres driver wraps the PG error)
      const isUniqueViolation =
        (error instanceof Error && error.message.includes('unique constraint')) ||
        (error instanceof Error && error.message.includes('duplicate')) ||
        (error instanceof Error &&
          (error as Error & { cause?: { code?: string } }).cause?.code === '23505');

      if (isUniqueViolation) {
        console.log(`⏭️  User ${testUser.username} already exists, skipping`);
        skippedCount++;
      } else {
        console.error(`❌ Error creating user ${testUser.username}:`, error);
        errorCount++;
        // Continue with next user instead of throwing
      }
    }
  }

  // Summary
  console.log('\n📊 Seeding Summary:');
  console.log(`   ✅ Created: ${createdCount} users`);
  console.log(`   ⏭️  Skipped: ${skippedCount} users (already exist)`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
  }
  console.log(`   📦 Total processed: ${testUsers.length} test users`);
  console.log('✅ Seeding complete!');

  await client.end();

  return {
    created: createdCount,
    skipped: skippedCount,
    errors: errorCount,
    total: testUsers.length,
  };
}

/**
 * Seed the database with dummy dataset, records, and assignments for employee testing
 * Creates a test dataset with 10 records and 8 assignments distributed across employees
 */
export async function seedTestDataset() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = postgres(databaseUrl);

  try {
    // 1. Create a test dataset
    console.log('🌱 Creating test dataset...');
    const datasetResult = await client`
      INSERT INTO datasets (
        name,
        dataset_type,
        source,
        status,
        uploaded_by,
        total_records,
        valid_records,
        created_at,
        updated_at
      )
      VALUES (
        'Test Dataset',
        'BUSINESS_REGISTRY',
        'TEST',
        'READY',
        33,
        10,
        10,
        NOW(),
        NOW()
      )
      RETURNING id
    `;
    const datasetId = datasetResult[0].id;
    console.log(`✅ Created dataset with ID: ${datasetId}`);

    // 2. Create 10 dummy dataset records
    console.log('🌱 Creating 10 dataset records...');
    const records = [];
    for (let i = 1; i <= 10; i++) {
      const idsbr = 'ID-' + String(i).padStart(3, '0');
      const namaUsaha = 'PT Usaha Jaya ' + i;
      const alamatUsaha = 'Jalan Merdeka No.' + i + ', Jakarta Pusat';
      const perusahaanId = 'CORP-' + String(i).padStart(5, '0');
      const gcid = 'GC-' + String(i).padStart(5, '0');
      const latitude = -6.1944 + (i * 0.001);
      const longitude = 106.8270 + (i * 0.001);
      const namaUsahaGc = 'PT Usaha Jaya ' + i;
      const alamatUsahaGc = 'Jalan Merdeka No.' + i + ', Jakarta Pusat';

      const recordResult = await client`
        INSERT INTO dataset_records (
          dataset_id,
          idsbr,
          nama_usaha,
          alamat_usaha,
          kode_wilayah,
          kdprov,
          kdkab,
          kdkec,
          kddesa,
          nmprov,
          nmkab,
          nmkec,
          nmdesa,
          perusahaan_id,
          status_perusahaan,
          skor_kalo,
          kegiatan_usaha,
          rank_nama,
          rank_alamat,
          history_ref_profiling_id,
          skala_usaha,
          sumber_data,
          latitude,
          longitude,
          latlong_status,
          gcid,
          gcs_result,
          allow_cancel,
          allow_edit,
          allow_flagging,
          latitude_gc,
          longitude_gc,
          latlong_status_gc,
          gc_username,
          nama_usaha_gc,
          alamat_usaha_gc,
          created_at,
          updated_at
        )
        VALUES (
          ${datasetId},
          ${idsbr},
          ${namaUsaha},
          ${alamatUsaha},
          '3173',
          '31',
          '73',
          '1001',
          '1001001',
          'DKI JAKARTA',
          'JAKARTA PUSAT',
          'Menteng',
          'Cikini',
          ${perusahaanId},
          'ACTIVE',
          '85.5',
          'Usaha Jasa',
          '0.95',
          '0.92',
          NOW(),
          'LARGE',
          'TEST_SOURCE',
          ${latitude},
          ${longitude},
          'VERIFIED',
          ${gcid},
          0.98,
          true,
          true,
          true,
          ${latitude},
          ${longitude},
          'VERIFIED',
          'gc_user_test',
          ${namaUsahaGc},
          ${alamatUsahaGc},
          NOW(),
          NOW()
        )
        RETURNING id
      `;
      records.push(recordResult[0].id);
    }
    console.log(`✅ Created ${records.length} dataset records`);

    // 3. Create 8 assignments with varying statuses
    console.log('🌱 Creating 8 assignments...');
    const assignments_data = [
      // karyawan1 (36): 3 assignments (1 PENDING, 1 IN_PROGRESS, 1 COMPLETED)
      {
        recordAId: records[0],
        recordBId: records[1],
        employeeId: 36,
        similarityScore: 0.72,
        status: 'PENDING',
        verificationResult: null,
        verifiedAt: null,
        verifiedBy: null,
      },
      {
        recordAId: records[2],
        recordBId: records[3],
        employeeId: 36,
        similarityScore: 0.81,
        status: 'IN_PROGRESS',
        verificationResult: null,
        verifiedAt: null,
        verifiedBy: null,
      },
      {
        recordAId: records[4],
        recordBId: records[5],
        employeeId: 36,
        similarityScore: 0.89,
        status: 'COMPLETED',
        verificationResult: 'MATCH',
        verifiedAt: new Date(Date.now() - 3600000).toISOString(),
        verifiedBy: 34,
      },
      // karyawan2 (37): 3 assignments (1 PENDING, 1 IN_PROGRESS, 1 COMPLETED)
      {
        recordAId: records[6],
        recordBId: records[7],
        employeeId: 37,
        similarityScore: 0.75,
        status: 'PENDING',
        verificationResult: null,
        verifiedAt: null,
        verifiedBy: null,
      },
      {
        recordAId: records[1],
        recordBId: records[4],
        employeeId: 37,
        similarityScore: 0.84,
        status: 'IN_PROGRESS',
        verificationResult: null,
        verifiedAt: null,
        verifiedBy: null,
      },
      {
        recordAId: records[2],
        recordBId: records[6],
        employeeId: 37,
        similarityScore: 0.82,
        status: 'COMPLETED',
        verificationResult: 'NON_MATCH',
        verifiedAt: new Date(Date.now() - 7200000).toISOString(),
        verifiedBy: 34,
      },
      // karyawan3 (38): 2 assignments (both PENDING)
      {
        recordAId: records[8],
        recordBId: records[9],
        employeeId: 38,
        similarityScore: 0.78,
        status: 'PENDING',
        verificationResult: null,
        verifiedAt: null,
        verifiedBy: null,
      },
      {
        recordAId: records[3],
        recordBId: records[8],
        employeeId: 38,
        similarityScore: 0.87,
        status: 'PENDING',
        verificationResult: null,
        verifiedAt: null,
        verifiedBy: null,
      },
    ];

    let assignmentCount = 0;
    for (const assignment of assignments_data) {
      await client`
        INSERT INTO assignments (
          record_a_id,
          record_b_id,
          employee_id,
          similarity_score,
          status,
          created_by,
          verification_result,
          verified_at,
          verified_by,
          created_at,
          updated_at
        )
        VALUES (
          ${assignment.recordAId},
          ${assignment.recordBId},
          ${assignment.employeeId},
          ${assignment.similarityScore},
          ${assignment.status},
          34,
          ${assignment.verificationResult},
          ${assignment.verifiedAt},
          ${assignment.verifiedBy},
          NOW(),
          NOW()
        )
      `;
      assignmentCount++;
    }
    console.log(`✅ Created ${assignmentCount} assignments`);

    // 4. Verify counts
    console.log('\n📊 Verification Results:');
    
    const datasetCount = await client`SELECT COUNT(*) as count FROM datasets`;
    console.log(`   Datasets: ${datasetCount[0].count} total`);

    const recordCount = await client`SELECT COUNT(*) as count FROM dataset_records WHERE dataset_id = ${datasetId}`;
    console.log(`   Dataset Records (ID ${datasetId}): ${recordCount[0].count}`);

    const assignmentCount_query = await client`SELECT COUNT(*) as count FROM assignments`;
    console.log(`   Total Assignments: ${assignmentCount_query[0].count}`);

    // Assignment distribution by employee
    const byEmployee = await client`
      SELECT employee_id, COUNT(*) as count, status
      FROM assignments
      GROUP BY employee_id, status
      ORDER BY employee_id, status
    `;
    console.log('\n   Assignments by Employee & Status:');
    for (const row of byEmployee) {
      console.log(`     Employee ${row.employee_id}: ${row.count} ${row.status}`);
    }

    // Status distribution
    const byStatus = await client`
      SELECT status, COUNT(*) as count
      FROM assignments
      GROUP BY status
      ORDER BY status
    `;
    console.log('\n   Assignments by Status:');
    for (const row of byStatus) {
      console.log(`     ${row.status}: ${row.count}`);
    }

    console.log('\n✅ Test dataset seeding complete!');

    return {
      datasetId,
      recordCount: records.length,
      assignmentCount,
    };
  } catch (error) {
    console.error('❌ Error during test dataset seeding:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Auto-execute when run directly as a script (tsx src/lib/db/seed.ts)
if (require.main === module || process.argv[1]?.endsWith('seed.ts')) {
  const args = process.argv.slice(2);
  
  if (args.includes('--dataset')) {
    seedTestDataset()
      .then((result) => {
        process.exit(0);
      })
      .catch((error) => {
        console.error('Fatal error during dataset seeding:', error);
        process.exit(1);
      });
  } else {
    seedTestUsers()
      .then((result) => {
        process.exit(0);
      })
      .catch((error) => {
        console.error('Fatal error during seeding:', error);
        process.exit(1);
      });
  }
}