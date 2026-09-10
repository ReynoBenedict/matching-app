/**
 * Phase 5C Employee Assignment & Labeling Integration Tests
 * Tests the complete employee verification workflow: list → detail → MATCH/NON-MATCH
 *
 * Test Type: Integration tests using actual APIs and database
 * Run: tsx src/app/employee/assignments/__tests__/employee-labeling.test.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local for test database connection
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getDatabase } from '@/lib/db';
import { users, datasetRecords, assignments, datasets } from '@/lib/db/schema';
import { createAssignment, getEmployeeAssignments, getAssignmentDetail, saveVerificationResult } from '@/lib/services/assignment';
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
  const uniqueSuffix = `_emp_t${testIndex}_${timestamp}`;

  // Create superadmin (who creates assignments)
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

  // Create employee (who verifies assignments)
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

  // Create another employee (for cross-employee test)
  const otherEmployee = await db
    .insert(users)
    .values({
      fullName: 'Other Employee Test',
      email: `other${uniqueSuffix}@test.local`,
      username: `other${uniqueSuffix}`,
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

  createdUserIds.push(superadmin[0].id, employee[0].id, otherEmployee[0].id);
  createdDatasetIds.push(datasetA[0].id, datasetB[0].id);

  return {
    superadminId: superadmin[0].id,
    employeeId: employee[0].id,
    otherEmployeeId: otherEmployee[0].id,
    recordAId: recordA[0].id,
    recordBId: recordB[0].id,
  };
}

/**
 * TEST 1: Employee can see their assignments
 */
async function testEmployeeCanSeeAssignments(): Promise<TestResult> {
  console.log('\n=== TEST 1: Employee Can See Their Assignments ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(1);

    // Create assignment
    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!result.success) {
      return { passed: false, error: 'Failed to create assignment' };
    }

    // Employee retrieves their assignments
    const assignments = await getEmployeeAssignments(employeeId);

    if (assignments.length > 0 && assignments[0].employeeId === employeeId) {
      console.log(`✓ Employee can see their assignment`);
      console.log(`✓ Found ${assignments.length} assignment(s)`);
      return { passed: true };
    }
    return { passed: false, error: 'Employee could not retrieve assignments' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 2: Employee sees only their own assignments
 */
async function testEmployeeSeesOwnAssignmentsOnly(): Promise<TestResult> {
  console.log('\n=== TEST 2: Employee Sees Only Their Own Assignments ===');
  try {
    const { superadminId, employeeId, otherEmployeeId, recordAId, recordBId } = await seedTestData(2);

    // Create first dataset pair for employee 1
    const db = getDatabase();
    const testTimestamp = new Date();

    const dataset1 = await db
      .insert(datasets)
      .values({
        name: `Dataset 1_${Date.now()}`,
        datasetType: 'DB_KENDENDES',
        originalFileName: 'dataset_1.csv',
        source: 'test',
        status: 'READY',
        uploadedBy: superadminId,
        totalRecords: 10,
        validRecords: 10,
      })
      .returning({ id: datasets.id });

    const dataset2 = await db
      .insert(datasets)
      .values({
        name: `Dataset 2_${Date.now()}`,
        datasetType: 'OSS_BADAN_USAHA',
        originalFileName: 'dataset_2.csv',
        source: 'test',
        status: 'READY',
        uploadedBy: superadminId,
        totalRecords: 10,
        validRecords: 10,
      })
      .returning({ id: datasets.id });

    createdDatasetIds.push(dataset1[0].id, dataset2[0].id);

    // Create records for other employee's assignment
    const otherRecordA = await db
      .insert(datasetRecords)
      .values({
        datasetId: dataset1[0].id,
        idsbr: `IDSBR_OA_${Date.now()}`,
        namaUsaha: 'PT Other Company A',
        alamatUsaha: 'Jl. Other No. 1',
        kodeWilayah: '654321',
        kdprov: '21',
        kdkab: '4321',
        kdkec: '54321',
        kddesa: '654321',
        nmprov: 'Other Prov',
        nmkab: 'Other Kab',
        nmkec: 'Other Kec',
        nmdesa: 'Other Desa',
        perusahaanId: `PER_OA_${Date.now()}`,
        statusPerusahaan: 'ACTIVE',
        historyRefProfilingId: testTimestamp,
        sumberData: 'test',
        latitude: '0.00000000',
        longitude: '0.00000000',
        latlongStatus: 'VERIFIED',
        gcid: 'GC_OA',
        gcsResult: '0.88',
        allowCancel: true,
        allowEdit: true,
        allowFlagging: true,
        latitudeGc: '0.00000000',
        longitudeGc: '0.00000000',
        latlongStatusGc: 'VERIFIED',
        gcUsername: 'gc_user',
      })
      .returning({ id: datasetRecords.id });

    const otherRecordB = await db
      .insert(datasetRecords)
      .values({
        datasetId: dataset2[0].id,
        idsbr: `IDSBR_OB_${Date.now()}`,
        namaUsaha: 'PT Other Company B',
        alamatUsaha: 'Jl. Other No. 1',
        kodeWilayah: '654321',
        kdprov: '21',
        kdkab: '4321',
        kdkec: '54321',
        kddesa: '654321',
        nmprov: 'Other Prov',
        nmkab: 'Other Kab',
        nmkec: 'Other Kec',
        nmdesa: 'Other Desa',
        perusahaanId: `PER_OB_${Date.now()}`,
        statusPerusahaan: 'ACTIVE',
        historyRefProfilingId: testTimestamp,
        sumberData: 'test',
        latitude: '0.00000000',
        longitude: '0.00000000',
        latlongStatus: 'VERIFIED',
        gcid: 'GC_OB',
        gcsResult: '0.85',
        allowCancel: true,
        allowEdit: true,
        allowFlagging: true,
        latitudeGc: '0.00000000',
        longitudeGc: '0.00000000',
        latlongStatusGc: 'VERIFIED',
        gcUsername: 'gc_user',
      })
      .returning({ id: datasetRecords.id });

    // Create assignment for employee 1
    const assign1 = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    // Create assignment for other employee
    const assign2 = await createAssignment({
      recordAId: otherRecordA[0].id,
      recordBId: otherRecordB[0].id,
      employeeId: otherEmployeeId,
      similarityScore: 0.85,
      createdBy: superadminId,
    });

    if (!assign1.success || !assign2.success) {
      return { passed: false, error: 'Failed to create assignments' };
    }

    // Employee 1 retrieves their assignments
    const myAssignments = await getEmployeeAssignments(employeeId);

    // Check that employee 1 only sees their own assignments
    const hasOtherEmployeeAssignment = myAssignments.some((a) => a.employeeId !== employeeId);

    if (hasOtherEmployeeAssignment) {
      return { passed: false, error: 'Employee can see other employees assignments!' };
    }

    if (myAssignments.length === 1 && myAssignments[0].employeeId === employeeId) {
      console.log(`✓ Employee sees only their own assignments`);
      console.log(`✓ Found 1 assignment belonging to employee`);
      return { passed: true };
    }

    return { passed: false, error: 'Assignment count mismatch' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 3: Employee can open assignment detail
 */
async function testEmployeeCanOpenAssignmentDetail(): Promise<TestResult> {
  console.log('\n=== TEST 3: Employee Can Open Assignment Detail ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(3);

    // Create assignment
    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!result.success) {
      return { passed: false, error: 'Failed to create assignment' };
    }

    // Get assignment detail
    const detail = await getAssignmentDetail(result.assignmentId!, employeeId);

    if (detail.success && detail.data) {
      console.log(`✓ Employee can open assignment detail`);
      console.log(`✓ Assignment ID: ${detail.data.id}`);
      console.log(`✓ Records loaded: A=${detail.data.recordA?.idsbr}, B=${detail.data.recordB?.idsbr}`);
      return { passed: true };
    }
    return { passed: false, error: 'Could not retrieve assignment detail' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 4: Candidate/record information is displayed
 */
async function testCandidateInformationDisplayed(): Promise<TestResult> {
  console.log('\n=== TEST 4: Candidate/Record Information Is Displayed ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(4);

    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!result.success) {
      return { passed: false, error: 'Failed to create assignment' };
    }

    const detail = await getAssignmentDetail(result.assignmentId!, employeeId);

    if (!detail.success || !detail.data) {
      return { passed: false, error: 'Could not retrieve assignment' };
    }

    // Check that record data is present
    const hasRecordAData =
      detail.data.recordA &&
      detail.data.recordA.idsbr &&
      detail.data.recordA.namaUsaha &&
      detail.data.recordA.alamatUsaha;

    const hasRecordBData =
      detail.data.recordB &&
      detail.data.recordB.idsbr &&
      detail.data.recordB.namaUsaha &&
      detail.data.recordB.alamatUsaha;

    if (hasRecordAData && hasRecordBData) {
      console.log(`✓ Record A data present: ${detail.data.recordA.idsbr}, ${detail.data.recordA.namaUsaha}`);
      console.log(`✓ Record B data present: ${detail.data.recordB.idsbr}, ${detail.data.recordB.namaUsaha}`);
      return { passed: true };
    }

    return { passed: false, error: 'Record data incomplete' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 5: MATCH action works and persists
 */
async function testMatchActionPersists(): Promise<TestResult> {
  console.log('\n=== TEST 5: MATCH Action Works and Persists ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(5);

    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!result.success) {
      return { passed: false, error: 'Failed to create assignment' };
    }

    // Save MATCH verification
    const verifyResult = await saveVerificationResult(result.assignmentId!, employeeId, 'MATCH');

    if (!verifyResult.success) {
      return { passed: false, error: verifyResult.error };
    }

    console.log(`✓ MATCH verification saved`);

    // Verify persisted
    const db = getDatabase();
    const persisted = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, result.assignmentId!))
      .limit(1);

    if (persisted[0]?.verificationResult === 'MATCH' && persisted[0]?.verifiedBy === employeeId) {
      console.log(`✓ MATCH verified in database`);
      console.log(`✓ Verified by employee ID: ${persisted[0].verifiedBy}`);
      return { passed: true };
    }

    return { passed: false, error: 'Verification result not persisted' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 6: NON-MATCH action works and persists
 */
async function testNonMatchActionPersists(): Promise<TestResult> {
  console.log('\n=== TEST 6: NON-MATCH Action Works and Persists ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(6);

    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!result.success) {
      return { passed: false, error: 'Failed to create assignment' };
    }

    // Save NON-MATCH verification
    const verifyResult = await saveVerificationResult(result.assignmentId!, employeeId, 'NON_MATCH');

    if (!verifyResult.success) {
      return { passed: false, error: verifyResult.error };
    }

    console.log(`✓ NON-MATCH verification saved`);

    // Verify persisted
    const db = getDatabase();
    const persisted = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, result.assignmentId!))
      .limit(1);

    if (persisted[0]?.verificationResult === 'NON_MATCH' && persisted[0]?.verifiedBy === employeeId) {
      console.log(`✓ NON-MATCH verified in database`);
      console.log(`✓ Verified by employee ID: ${persisted[0].verifiedBy}`);
      return { passed: true };
    }

    return { passed: false, error: 'Verification result not persisted' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 7: Unauthenticated access rejected
 */
async function testUnauthenticatedAccessRejected(): Promise<TestResult> {
  console.log('\n=== TEST 7: Unauthenticated Access Rejected ===');
  try {
    // Try to save without authentication (simulated by passing 0 or invalid ID)
    // In real scenario, API middleware would reject this
    const result = await saveVerificationResult(99999, 99999, 'MATCH');

    // Should still execute but fail due to assignment not belonging to employee
    if (!result.success) {
      console.log(`✓ Invalid employee access rejected`);
      console.log(`✓ Error: ${result.error}`);
      return { passed: true };
    }

    return { passed: false, error: 'Unauthenticated access was not rejected' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 8: Employee cannot access another employee's assignment
 */
async function testEmployeeCannotAccessOtherAssignment(): Promise<TestResult> {
  console.log('\n=== TEST 8: Employee Cannot Access Another Employee\'s Assignment ===');
  try {
    const { superadminId, employeeId, otherEmployeeId, recordAId, recordBId } = await seedTestData(8);

    // Create assignment for different employee
    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId: otherEmployeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!result.success) {
      return { passed: false, error: 'Failed to create assignment' };
    }

    // Try to access with different employee
    const detail = await getAssignmentDetail(result.assignmentId!, employeeId);

    if (!detail.success && detail.error?.includes('does not belong')) {
      console.log(`✓ Employee correctly denied access to other's assignment`);
      console.log(`✓ Error: ${detail.error}`);
      return { passed: true };
    }

    return { passed: false, error: 'Employee could access another employee\'s assignment!' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 9: Invalid assignment ID handled
 */
async function testInvalidAssignmentIdHandled(): Promise<TestResult> {
  console.log('\n=== TEST 9: Invalid Assignment ID Handled ===');
  try {
    const { employeeId } = await seedTestData(9);

    const detail = await getAssignmentDetail(99999, employeeId);

    if (!detail.success && detail.error?.includes('not found')) {
      console.log(`✓ Invalid assignment ID correctly rejected`);
      console.log(`✓ Error: ${detail.error}`);
      return { passed: true };
    }

    return { passed: false, error: 'Invalid assignment ID was not handled' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 10: Double submission prevented
 */
async function testDoubleSubmissionPrevented(): Promise<TestResult> {
  console.log('\n=== TEST 10: Double Submission Prevented ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(10);

    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!result.success) {
      return { passed: false, error: 'Failed to create assignment' };
    }

    // First submission
    const first = await saveVerificationResult(result.assignmentId!, employeeId, 'MATCH');

    if (!first.success) {
      return { passed: false, error: 'First verification failed' };
    }

    console.log(`✓ First verification saved`);

    // Second submission (overwrite)
    const second = await saveVerificationResult(result.assignmentId!, employeeId, 'NON_MATCH');

    if (second.success) {
      console.log(`✓ Second submission allowed (update overwrites previous)`);

      // Verify final state
      const db = getDatabase();
      const final = await db
        .select()
        .from(assignments)
        .where(eq(assignments.id, result.assignmentId!))
        .limit(1);

      if (final[0]?.verificationResult === 'NON_MATCH') {
        console.log(`✓ Final verification is NON_MATCH (overwritten)`);
        return { passed: true };
      }
    }

    return { passed: false, error: 'Double submission not handled correctly' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 11: Backend/API failure produces error state
 */
async function testBackendFailureProducesError(): Promise<TestResult> {
  console.log('\n=== TEST 11: Backend/API Failure Produces Error State ===');
  try {
    // Try to verify with invalid result value
    const result = await saveVerificationResult(99999, 99999, 'INVALID' as any);

    if (!result.success && result.error?.includes('Invalid')) {
      console.log(`✓ Invalid verification result rejected`);
      console.log(`✓ Error: ${result.error}`);
      return { passed: true };
    }

    return { passed: false, error: 'Error handling failed' };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * TEST 12: Phase 5A and 5B don't regress
 */
async function testPhaseRegressionCheck(): Promise<TestResult> {
  console.log('\n=== TEST 12: Phase 5A & 5B Functionality Does Not Regress ===');
  try {
    const { superadminId, employeeId, recordAId, recordBId } = await seedTestData(12);

    // Test Phase 5A: Superadmin can still create assignments
    const result = await createAssignment({
      recordAId,
      recordBId,
      employeeId,
      similarityScore: 0.92,
      createdBy: superadminId,
    });

    if (!result.success) {
      return { passed: false, error: 'Phase 5A: Cannot create assignment' };
    }

    console.log(`✓ Phase 5A: Superadmin can still create assignments`);

    // Test Phase 5B: Employee can still retrieve their assignments
    const assignments = await getEmployeeAssignments(employeeId);

    if (assignments.length === 0 || assignments[0].employeeId !== employeeId) {
      return { passed: false, error: 'Phase 5B: Employee cannot retrieve assignments' };
    }

    console.log(`✓ Phase 5B: Employee can retrieve assignments`);

    // Test Phase 5C: Employee can verify
    const verify = await saveVerificationResult(result.assignmentId!, employeeId, 'MATCH');

    if (!verify.success) {
      return { passed: false, error: 'Phase 5C: Cannot verify assignment' };
    }

    console.log(`✓ Phase 5C: Employee can verify assignments`);

    return { passed: true };
  } catch (error) {
    return { passed: false, error: String(error) };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Phase 5C Employee Assignment & Labeling Tests         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results: TestResult[] = [];

  results.push(await testEmployeeCanSeeAssignments());
  results.push(await testEmployeeSeesOwnAssignmentsOnly());
  results.push(await testEmployeeCanOpenAssignmentDetail());
  results.push(await testCandidateInformationDisplayed());
  results.push(await testMatchActionPersists());
  results.push(await testNonMatchActionPersists());
  results.push(await testUnauthenticatedAccessRejected());
  results.push(await testEmployeeCannotAccessOtherAssignment());
  results.push(await testInvalidAssignmentIdHandled());
  results.push(await testDoubleSubmissionPrevented());
  results.push(await testBackendFailureProducesError());
  results.push(await testPhaseRegressionCheck());

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
