/**
 * Phase 5B Assignment UI Integration Tests
 * Tests the complete Superadmin assignment workflow
 *
 * Test Type: Integration tests using actual APIs and database
 * Run: tsx src/app/superadmin/assignments/__tests__/assignments-ui.test.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local for test database connection
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getDatabase } from '@/lib/db';
import { users, datasetRecords, assignments, datasets } from '@/lib/db/schema';
import { createAssignment, getEmployeeAssignments } from '@/lib/services/assignment';
import { eq, inArray } from 'drizzle-orm';

interface TestResult {
  passed: boolean;
  error?: string;
}

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
 * Helper to create unique test data
 */
async function seedTestData(testIndex: number) {
  const db = getDatabase();
  const timestamp = Date.now();
  const uniqueSuffix = `_ui_t${testIndex}_${timestamp}`;

  // Create superadmin
  const superadmin = await db
    .insert(users)
    .values({
      fullName: 'Superadmin Test',
      email: `superadmin${uniqueSuffix}@test.local`,
      username: `superadmin${uniqueSuffix}`,
      passwordHash: 'hashed_password',
      role: 'ADMIN',
      status: 'ACTIVE',
    })
    .returning({ id: users.id });

  // Create employee
  const employee = await db
    .insert(users)
    .values({
      fullName: 'Employee Test',
      email: `employee${uniqueSuffix}@test.local`,
      username: `employee${uniqueSuffix}`,
      passwordHash: 'hashed_password',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    })
    .returning({ id: users.id });

  // Create datasets
  const datasetA = await db
    .insert(datasets)
    .values({
      name: `Dataset A${uniqueSuffix}`,
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
      name: `Dataset B${uniqueSuffix}`,
      datasetType: 'OSS_BADAN_USAHA',
      originalFileName: 'dataset_b.csv',
      source: 'test',
      status: 'READY',
      uploadedBy: superadmin[0].id,
      totalRecords: 10,
      validRecords: 10,
    })
    .returning({ id: datasets.id });

  // Create records
  const testTimestamp = new Date();

  const recordA = await db
    .insert(datasetRecords)
    .values({
      datasetId: datasetA[0].id,
      idsbr: `IDSBR_A${uniqueSuffix}`,
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
      perusahaanId: `PER_001${uniqueSuffix}`,
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
      idsbr: `IDSBR_B${uniqueSuffix}`,
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
      perusahaanId: `PER_002${uniqueSuffix}`,
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
 * TEST 1: Assignment creation via service layer (backend API simulation)
 */
async function testAssignmentCreation(): Promise<TestResult> {
  console.log('\n=== TEST 1: Assignment Creation via Backend API ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(1);

    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (result.success && result.assignmentId) {
      console.log(`✓ Assignment created successfully (ID: ${result.assignmentId})`);

      // Verify persisted
      const db = getDatabase();
      const persisted = await db
        .select()
        .from(assignments)
        .where(eq(assignments.id, result.assignmentId))
        .limit(1);

      if (persisted.length > 0) {
        console.log('✓ Assignment verified in database');
        console.log(`✓ Fields: recordAId=${persisted[0].recordAId}, recordBId=${persisted[0].recordBId}, employeeId=${persisted[0].employeeId}`);
        return { passed: true };
      }
    }
    return { passed: false, error: 'Assignment not persisted' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 2: Invalid employee rejection
 */
async function testInvalidEmployeeRejection(): Promise<TestResult> {
  console.log('\n=== TEST 2: Invalid Employee Rejection ===');
  try {
    const { superadminId, recordAId, recordBId } = await seedTestData(2);

    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId: 99999, // Non-existent
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!result.success && result.error?.includes('not found')) {
      console.log('✓ Invalid employee correctly rejected');
      console.log(`✓ Error: ${result.error}`);
      return { passed: true };
    }
    return { passed: false, error: 'Invalid employee was not rejected' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 3: Invalid record rejection
 */
async function testInvalidRecordRejection(): Promise<TestResult> {
  console.log('\n=== TEST 3: Invalid Record Rejection ===');
  try {
    const { superadminId, employeeId } = await seedTestData(3);

    const result = await createAssignment({
      recordAId: 99999,
      recordBId: 88888,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!result.success && result.error?.includes('not found')) {
      console.log('✓ Invalid records correctly rejected');
      console.log(`✓ Error: ${result.error}`);
      return { passed: true };
    }
    return { passed: false, error: 'Invalid records were not rejected' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 4: Duplicate assignment prevention
 */
async function testDuplicateAssignmentPrevention(): Promise<TestResult> {
  console.log('\n=== TEST 4: Duplicate Assignment Prevention ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(4);

    // First assignment
    const first = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!first.success) {
      return { passed: false, error: 'First assignment failed' };
    }

    console.log(`✓ First assignment created (ID: ${first.assignmentId})`);

    // Duplicate attempt
    const duplicate = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.95,
      createdBy: superadminId,
    });

    if (!duplicate.success && duplicate.error?.includes('already exists')) {
      console.log('✓ Duplicate correctly rejected');
      console.log(`✓ Error: ${duplicate.error}`);
      return { passed: true };
    }
    return { passed: false, error: 'Duplicate was not prevented' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 5: Employee retrieval enforcement
 */
async function testEmployeeRetrievalEnforcement(): Promise<TestResult> {
  console.log('\n=== TEST 5: Employee Retrieval Enforcement ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(5);

    // Create assignment
    const assignment = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!assignment.success) {
      return { passed: false, error: 'Setup failed' };
    }

    // Retrieve as employee
    const myAssignments = await getEmployeeAssignments(employeeId);

    if (myAssignments.length > 0 && myAssignments[0].employeeId === employeeId) {
      console.log('✓ Employee retrieved their own assignment');
      console.log(`✓ Found ${myAssignments.length} assignment(s)`);
      return { passed: true };
    }
    return { passed: false, error: 'Employee retrieval failed' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 6: Non-superadmin authorization rejection
 */
async function testNonSuperadminRejection(): Promise<TestResult> {
  console.log('\n=== TEST 6: Non-Superadmin Authorization Rejection ===');
  try {
    const { employeeId, recordAId, recordBId } = await seedTestData(6);

    // Try to create as employee (createdBy = employeeId)
    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: employeeId,
    });

    if (!result.success && result.error?.includes('superadmin')) {
      console.log('✓ Non-superadmin correctly rejected');
      console.log(`✓ Error: ${result.error}`);
      return { passed: true };
    }
    return { passed: false, error: 'Non-superadmin was not rejected' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 7: Similarity score range validation
 */
async function testSimilarityScoreValidation(): Promise<TestResult> {
  console.log('\n=== TEST 7: Similarity Score Range Validation ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(7);

    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 1.5, // Invalid
      createdBy: superadminId,
    });

    if (!result.success && result.error?.includes('between 0 and 1')) {
      console.log('✓ Invalid score correctly rejected');
      console.log(`✓ Error: ${result.error}`);
      return { passed: true };
    }
    return { passed: false, error: 'Score validation failed' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Phase 5B Assignment UI Integration Tests              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results: TestResult[] = [];

  results.push(await testAssignmentCreation());
  results.push(await testInvalidEmployeeRejection());
  results.push(await testInvalidRecordRejection());
  results.push(await testDuplicateAssignmentPrevention());
  results.push(await testEmployeeRetrievalEnforcement());
  results.push(await testNonSuperadminRejection());
  results.push(await testSimilarityScoreValidation());

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║  Results: ${passed}/${total} Tests Passed ${passed === total ? '✓' : '✗'}${' '.repeat(34 - String(passed).length)}║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  return { passed, total, results };
}

// Run tests if executed directly
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
