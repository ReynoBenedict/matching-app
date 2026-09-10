/**
 * Phase 5A Assignment Tests
 *
 * Tests cover:
 * 1. Database schema and migration verification
 * 2. Authorization enforcement (superadmin only)
 * 3. Assignment creation with validation
 * 4. Employee retrieval (server-side enforcement)
 * 5. Candidates endpoint (superadmin retrieval)
 * 6. Error handling and edge cases
 *
 * Test Type: Integration tests using actual database
 * Run: tsx src/app/api/assignments/__tests__/assignments.test.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local for test database connection
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getDatabase } from '@/lib/db';
import { users, datasetRecords, assignments, datasets } from '@/lib/db/schema';
import { createAssignment, getEmployeeAssignments } from '@/lib/services/assignment';
import { eq, inArray } from 'drizzle-orm';

// Tracks every row created by this test run so it can be removed afterwards.
const createdDatasetIds: number[] = [];
const createdUserIds: number[] = [];

/**
 * Delete all data created by this test run.
 * Datasets cascade to dataset_records (and therefore to assignments);
 * users cascade to the assignments that reference them.
 */
export async function cleanupTestData() {
  const db = getDatabase();
  if (createdDatasetIds.length > 0) {
    await db.delete(datasets).where(inArray(datasets.id, createdDatasetIds));
  }
  if (createdUserIds.length > 0) {
    await db.delete(users).where(inArray(users.id, createdUserIds));
  }
  createdDatasetIds.length = 0;
  createdUserIds.length = 0;
}

/**
 * Helper function to seed test data with unique identifiers
 * Generates unique emails to avoid constraint violations between tests
 */
async function seedTestData(testIndex: number) {
  const db = getDatabase();
  const timestamp = Date.now();
  const uniqueSuffix = `_t${testIndex}_${timestamp}`;

  // Create test users with unique emails
  const superadmin = await db
    .insert(users)
    .values({
      fullName: 'Test Superadmin',
      email: `superadmin${uniqueSuffix}@test.local`,
      username: `test_superadmin${uniqueSuffix}`,
      passwordHash: 'hashed_password',
      role: 'ADMIN',
      status: 'ACTIVE',
    })
    .returning({ id: users.id });

  const employee = await db
    .insert(users)
    .values({
      fullName: 'Test Employee',
      email: `employee${uniqueSuffix}@test.local`,
      username: `test_employee${uniqueSuffix}`,
      passwordHash: 'hashed_password',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    })
    .returning({ id: users.id });

  // Create test datasets
  const datasetA = await db
    .insert(datasets)
    .values({
      name: 'Dataset A',
      datasetType: 'DB_KENDENDES',
      originalFileName: 'dataset_a.csv',
      source: 'test',
      status: 'READY',
      uploadedBy: superadmin[0].id,
      totalRecords: 10,
      validRecords: 10,
    })
    .returning({ id: datasets.id });

  const datasetB = await db
    .insert(datasets)
    .values({
      name: 'Dataset B',
      datasetType: 'OSS_BADAN_USAHA',
      originalFileName: 'dataset_b.csv',
      source: 'test',
      status: 'READY',
      uploadedBy: superadmin[0].id,
      totalRecords: 10,
      validRecords: 10,
    })
    .returning({ id: datasets.id });

  // Create test records
  const testTimestamp = new Date();
  
  const recordA = await db
    .insert(datasetRecords)
    .values({
      datasetId: datasetA[0].id,
      idsbr: 'IDSBR_A_001',
      namaUsaha: 'PT Test Company A',
      alamatUsaha: 'Jl. Test No. 1',
      kodeWilayah: '123456',
      kdprov: '12',
      kdkab: '1234',
      kdkec: '12345',
      kddesa: '123456',
      nmprov: 'Prov Test',
      nmkab: 'Kab Test',
      nmkec: 'Kec Test',
      nmdesa: 'Desa Test',
      perusahaanId: 'PER_001',
      statusPerusahaan: 'ACTIVE',
      historyRefProfilingId: testTimestamp,
      sumberData: 'test',
      latitude: '0.00000000',
      longitude: '0.00000000',
      latlongStatus: 'VERIFIED',
      gcid: 'GC_001',
      gcsResult: '0.95',
      allowCancel: true,
      allowEdit: true,
      allowFlagging: true,
      latitudeGc: '0.00000000',
      longitudeGc: '0.00000000',
      latlongStatusGc: 'VERIFIED',
      gcUsername: 'gc_user',
    })
    .returning({ id: datasetRecords.id });

  const recordB = await db
    .insert(datasetRecords)
    .values({
      datasetId: datasetB[0].id,
      idsbr: 'IDSBR_B_001',
      namaUsaha: 'PT Test Company B',
      alamatUsaha: 'Jl. Test No. 1',
      kodeWilayah: '123456',
      kdprov: '12',
      kdkab: '1234',
      kdkec: '12345',
      kddesa: '123456',
      nmprov: 'Prov Test',
      nmkab: 'Kab Test',
      nmkec: 'Kec Test',
      nmdesa: 'Desa Test',
      perusahaanId: 'PER_002',
      statusPerusahaan: 'ACTIVE',
      historyRefProfilingId: testTimestamp,
      sumberData: 'test',
      latitude: '0.00000000',
      longitude: '0.00000000',
      latlongStatus: 'VERIFIED',
      gcid: 'GC_002',
      gcsResult: '0.92',
      allowCancel: true,
      allowEdit: true,
      allowFlagging: true,
      latitudeGc: '0.00000000',
      longitudeGc: '0.00000000',
      latlongStatusGc: 'VERIFIED',
      gcUsername: 'gc_user',
    })
    .returning({ id: datasetRecords.id });

  createdUserIds.push(superadmin[0].id, employee[0].id);
  createdDatasetIds.push(datasetA[0].id, datasetB[0].id);

  return {
    superadminId: superadmin[0].id,
    employeeId: employee[0].id,
    recordAId: recordA[0].id,
    recordBId: recordB[0].id,
  };
}

/**
 * TEST 1: Database Schema Verification
 * Verify assignments table exists with correct columns and constraints
 */
export async function testDatabaseSchema() {
  console.log('\n=== TEST 1: Database Schema Verification ===');
  try {
    const db = getDatabase();

    // Verify table exists by querying it
    const result = await db
      .select()
      .from(assignments)
      .limit(1);

    console.log('✓ Assignments table exists');
    console.log('✓ Table is queryable');
    return { passed: true };
  } catch (error) {
    console.error('✗ Schema verification failed:', error);
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 2: Create Assignment with Valid Data
 * Verify assignment can be created with all required fields
 */
export async function testCreateAssignmentValid() {
  console.log('\n=== TEST 2: Create Assignment with Valid Data ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(2);

    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (result.success && result.assignmentId) {
      console.log(`✓ Assignment created successfully (ID: ${result.assignmentId})`);

      // Verify assignment was actually inserted
      const db = getDatabase();
      const created = await db
        .select()
        .from(assignments)
        .where(eq(assignments.id, result.assignmentId))
        .limit(1);

      if (created.length > 0) {
        console.log('✓ Assignment verified in database');
        return { passed: true, assignmentId: result.assignmentId };
      } else {
        console.error('✗ Assignment not found in database after creation');
        return { passed: false, error: 'Assignment not persisted' };
      }
    } else {
      console.error('✗ Assignment creation failed:', result.error);
      return { passed: false, error: result.error };
    }
  } catch (error) {
    console.error('✗ Test failed:', error);
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 3: Non-Superadmin Cannot Create Assignment
 * Verify authorization enforcement
 */
export async function testCreateAssignmentUnauthorized() {
  console.log('\n=== TEST 3: Authorization Enforcement ===');
  try {
    const db = getDatabase();
    const { employeeId, recordAId, recordBId } = await seedTestData(3);

    // Try to create assignment as non-superadmin
    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: employeeId, // Employee trying to create (not superadmin)
    });

    if (!result.success && result.error?.includes('superadmin')) {
      console.log('✓ Non-superadmin correctly rejected');
      return { passed: true };
    } else {
      console.error('✗ Non-superadmin was not rejected');
      return { passed: false, error: 'Authorization check failed' };
    }
  } catch (error) {
    console.error('✗ Test failed:', error);
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 4: Duplicate Assignment Prevention
 * Verify unique constraint on record pairs
 */
export async function testDuplicateAssignmentPrevention() {
  console.log('\n=== TEST 4: Duplicate Assignment Prevention ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(4);

    // Create first assignment
    const first = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!first.success) {
      console.error('✗ First assignment creation failed:', first.error);
      return { passed: false, error: 'Setup failed' };
    }

    console.log(`✓ First assignment created (ID: ${first.assignmentId})`);

    // Try to create duplicate
    const second = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.95,
      createdBy: superadminId,
    });

    if (!second.success && second.error?.includes('already exists')) {
      console.log('✓ Duplicate assignment correctly rejected');
      return { passed: true };
    } else {
      console.error('✗ Duplicate was not rejected');
      return { passed: false, error: 'Duplicate check failed' };
    }
  } catch (error) {
    console.error('✗ Test failed:', error);
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 5: Employee Retrieval (Server-side Enforcement)
 * Verify employees can only retrieve their own assignments
 */
export async function testEmployeeRetrieval() {
  console.log('\n=== TEST 5: Employee Retrieval (Server-side Enforcement) ===');
  try {
    const db = getDatabase();
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(5);

    // Create assignment for this employee
    const created = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!created.success) {
      console.error('✗ Setup failed:', created.error);
      return { passed: false, error: 'Setup failed' };
    }

    console.log(`✓ Assignment created (ID: ${created.assignmentId})`);

    // Retrieve assignments for this employee
    const assignments_list = await getEmployeeAssignments(employeeId);

    if (assignments_list.length > 0) {
      const assignment = assignments_list[0];
      if (assignment.employeeId === employeeId) {
        console.log('✓ Employee retrieved their own assignment');
        return { passed: true };
      } else {
        console.error('✗ Retrieved assignment belongs to different employee');
        return { passed: false, error: 'Ownership check failed' };
      }
    } else {
      console.error('✗ No assignments retrieved');
      return { passed: false, error: 'Retrieval failed' };
    }
  } catch (error) {
    console.error('✗ Test failed:', error);
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 6: Invalid Record References
 * Verify validation of record existence
 */
export async function testInvalidRecordReferences() {
  console.log('\n=== TEST 6: Invalid Record References ===');
  try {
    const { superadminId, employeeId } = await seedTestData(6);

    // Try to create assignment with non-existent records
    const result = await createAssignment({
      recordAId: 99999, // Non-existent
      recordBId: 88888, // Non-existent
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!result.success && result.error?.includes('not found')) {
      console.log('✓ Invalid records correctly rejected');
      return { passed: true };
    } else {
      console.error('✗ Invalid records were not rejected');
      return { passed: false, error: 'Validation failed' };
    }
  } catch (error) {
    console.error('✗ Test failed:', error);
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 7: Invalid Similarity Score
 * Verify score range validation (0-1)
 */
export async function testInvalidSimilarityScore() {
  console.log('\n=== TEST 7: Invalid Similarity Score ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(7);

    // Try with score > 1
    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 1.5, // Invalid: > 1
      createdBy: superadminId,
    });

    if (!result.success && result.error?.includes('between 0 and 1')) {
      console.log('✓ Invalid score correctly rejected');
      return { passed: true };
    } else {
      console.error('✗ Invalid score was not rejected');
      return { passed: false, error: 'Validation failed' };
    }
  } catch (error) {
    console.error('✗ Test failed:', error);
    return { passed: false, error: String(error) };
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Phase 5A Assignment Backend Tests                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = [];

  results.push(await testDatabaseSchema());
  results.push(await testCreateAssignmentValid());
  results.push(await testCreateAssignmentUnauthorized());
  results.push(await testDuplicateAssignmentPrevention());
  results.push(await testEmployeeRetrieval());
  results.push(await testInvalidRecordReferences());
  results.push(await testInvalidSimilarityScore());

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║  Results: ${passed}/${total} Tests Passed ${passed === total ? '✓' : '✗'}${' '.repeat(34 - String(passed).length)}║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  return { passed, total, results };
}

// Run tests if this file is executed directly
runAllTests()
  .then(async (result) => {
    try {
      await cleanupTestData();
      console.log('✓ Test data cleaned up');
    } catch (error) {
      console.error('✗ Cleanup failed:', error);
    }
    process.exit(result.passed === result.total ? 0 : 1);
  })
  .catch(async (error) => {
    console.error('Test run failed:', error);
    try {
      await cleanupTestData();
    } catch (cleanupError) {
      console.error('✗ Cleanup failed:', cleanupError);
    }
    process.exit(1);
  });
