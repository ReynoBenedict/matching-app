/**
 * Assignment service
 * Business logic for managing assignments of matching candidates to employees
 */

import { getDatabase } from '@/lib/db';
import { assignments, datasetRecords, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { recordAuditLog } from '@/lib/audit';

/**
 * Create a new assignment linking a candidate pair to an employee
 * Validates that:
 * - Both records exist
 * - Employee exists with EMPLOYEE role
 * - No duplicate assignment already exists
 * - Superadmin verification
 */
export async function createAssignment({
  recordAId,
  recordBId,
  employeeId,
  similarityScore,
  createdBy,
}: {
  recordAId: number;
  recordBId: number;
  employeeId: number;
  similarityScore: number;
  createdBy: number;
}): Promise<{
  success: boolean;
  error?: string;
  assignmentId?: number;
}> {
  try {
    const db = getDatabase();

    // Validate that creator is superadmin
    const creator = await db
      .select()
      .from(users)
      .where(eq(users.id, createdBy))
      .limit(1);

    if (creator.length === 0 || creator[0].role !== 'ADMIN') {
      return {
        success: false,
        error: 'Creator must be a superadmin',
      };
    }

    // Validate that both records exist
    const [recordA, recordB] = await Promise.all([
      db
        .select()
        .from(datasetRecords)
        .where(eq(datasetRecords.id, recordAId))
        .limit(1),
      db
        .select()
        .from(datasetRecords)
        .where(eq(datasetRecords.id, recordBId))
        .limit(1),
    ]);

    if (recordA.length === 0) {
      return {
        success: false,
        error: `Record A (ID: ${recordAId}) not found`,
      };
    }

    if (recordB.length === 0) {
      return {
        success: false,
        error: `Record B (ID: ${recordBId}) not found`,
      };
    }

    // Validate that employee exists and has EMPLOYEE role
    const employee = await db
      .select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);

    if (employee.length === 0) {
      return {
        success: false,
        error: `Employee (ID: ${employeeId}) not found`,
      };
    }

    if (employee[0].role !== 'EMPLOYEE') {
      return {
        success: false,
        error: `User (ID: ${employeeId}) is not an employee`,
      };
    }

    // Check for duplicate assignment (unique constraint on record pair)
    const existing = await db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.recordAId, recordAId),
          eq(assignments.recordBId, recordBId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: `Assignment for this record pair (A: ${recordAId}, B: ${recordBId}) already exists`,
      };
    }

    // Validate similarity score is in valid range (0-1 typically, but stored as numeric(5,4))
    if (similarityScore < 0 || similarityScore > 1) {
      return {
        success: false,
        error: 'Similarity score must be between 0 and 1',
      };
    }

    // Create the assignment
    const result = await db
      .insert(assignments)
      .values({
        recordAId,
        recordBId,
        employeeId,
        similarityScore: similarityScore.toString(),
        createdBy,
      })
      .returning({ id: assignments.id });

    const assignmentId = result[0]?.id;

    // Audit log
    await recordAuditLog({
      userId: createdBy,
      action: 'CREATE_ASSIGNMENT',
      entityType: 'ASSIGNMENT',
      entityId: assignmentId,
      metadata: {
        recordAId,
        recordBId,
        employeeId,
        similarityScore,
      },
    });

    return {
      success: true,
      assignmentId,
    };
  } catch (error) {
    console.error('Failed to create assignment:', error);
    return {
      success: false,
      error: 'Failed to create assignment',
    };
  }
}

/**
 * Get assignments for a specific employee
 * Server-side enforces that an employee can only retrieve their own assignments
 */
export async function getEmployeeAssignments(employeeId: number): Promise<
  Array<{
    id: number;
    recordAId: number;
    recordBId: number;
    employeeId: number;
    similarityScore: string; // numeric stored as string in Drizzle
    status: string;
    verificationResult: string | null;
    verifiedAt: Date | null;
    createdAt: Date;
    createdBy: number;
  }>
> {
  const db = getDatabase();

  const result = await db
    .select({
      id: assignments.id,
      recordAId: assignments.recordAId,
      recordBId: assignments.recordBId,
      employeeId: assignments.employeeId,
      similarityScore: assignments.similarityScore,
      status: assignments.status,
      verificationResult: assignments.verificationResult,
      verifiedAt: assignments.verifiedAt,
      createdAt: assignments.createdAt,
      createdBy: assignments.createdBy,
    })
    .from(assignments)
    .where(eq(assignments.employeeId, employeeId))
    .orderBy(assignments.createdAt);

  return result;
}

/**
 * Get a single assignment with full details (records + assignment info)
 * Server-side enforces ownership - only the assigned employee can view
 */
export async function getAssignmentDetail(assignmentId: number, employeeId: number): Promise<{
  success: boolean;
  error?: string;
  data?: {
    id: number;
    recordAId: number;
    recordBId: number;
    employeeId: number;
    similarityScore: string;
    status: string;
    verificationResult: string | null;
    verifiedAt: Date | null;
    createdAt: Date;
    recordA: any;
    recordB: any;
  };
}> {
  try {
    const db = getDatabase();

    // Get assignment - enforce employee ownership
    const assignment = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, assignmentId), eq(assignments.employeeId, employeeId)))
      .limit(1);

    if (assignment.length === 0) {
      return {
        success: false,
        error: 'Assignment not found or does not belong to this employee',
      };
    }

    const assign = assignment[0];

    // Get both records
    const [recordA, recordB] = await Promise.all([
      db
        .select()
        .from(datasetRecords)
        .where(eq(datasetRecords.id, assign.recordAId))
        .limit(1),
      db
        .select()
        .from(datasetRecords)
        .where(eq(datasetRecords.id, assign.recordBId))
        .limit(1),
    ]);

    return {
      success: true,
      data: {
        id: assign.id,
        recordAId: assign.recordAId,
        recordBId: assign.recordBId,
        employeeId: assign.employeeId,
        similarityScore: assign.similarityScore,
        status: assign.status,
        verificationResult: assign.verificationResult,
        verifiedAt: assign.verifiedAt,
        createdAt: assign.createdAt,
        recordA: recordA[0],
        recordB: recordB[0],
      },
    };
  } catch (error) {
    console.error('Failed to get assignment detail:', error);
    return {
      success: false,
      error: 'Failed to retrieve assignment',
    };
  }
}

/**
 * Get employee assignment progress
 * Phase 5D: Calculates completion percentage and pending count
 * Returns total, completed, and pending assignment counts
 */
export async function getEmployeeProgress(employeeId: number): Promise<{
  total: number;
  completed: number;
  pending: number;
  progressPercentage: number;
}> {
  const db = getDatabase();

  const result = await db
    .select({
      total: assignments.id,
      completed: assignments.id,
      status: assignments.status,
    })
    .from(assignments)
    .where(eq(assignments.employeeId, employeeId));

  const total = result.length;
  const completed = result.filter((r) => r.status === 'COMPLETED').length;
  const pending = total - completed;
  const progressPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    pending,
    progressPercentage,
  };
}

/**
 * Save employee's verification result (MATCH or NON-MATCH)
 * Phase 5D: Updates assignment status to COMPLETED after verification
 * Enforces employee ownership and valid result values
 */
export async function saveVerificationResult(
  assignmentId: number,
  employeeId: number,
  verificationResult: 'MATCH' | 'NON_MATCH'
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const db = getDatabase();

    // Validate result value
    if (!['MATCH', 'NON_MATCH'].includes(verificationResult)) {
      return {
        success: false,
        error: 'Invalid verification result. Must be MATCH or NON_MATCH',
      };
    }

    // Get assignment and verify ownership
    const assignment = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, assignmentId), eq(assignments.employeeId, employeeId)))
      .limit(1);

    if (assignment.length === 0) {
      return {
        success: false,
        error: 'Assignment not found or does not belong to this employee',
      };
    }

    // Phase 5D: Update with verification result AND set status to COMPLETED
    await db
      .update(assignments)
      .set({
        verificationResult,
        status: 'COMPLETED',
        verifiedAt: new Date(),
        verifiedBy: employeeId,
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, assignmentId));

    // Audit log
    await recordAuditLog({
      userId: employeeId,
      action: 'VERIFY_ASSIGNMENT',
      entityType: 'ASSIGNMENT',
      entityId: assignmentId,
      metadata: {
        verificationResult,
        previousStatus: 'PENDING',
        newStatus: 'COMPLETED',
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to save verification result:', error);
    return {
      success: false,
      error: 'Failed to save verification result',
    };
  }
}
