/**
 * Monitoring service
 * Aggregates real assignment and user data for the superadmin monitoring page.
 *
 * Every value returned here is derived directly from the database.
 * There is currently NO persistent matching-process table in the schema
 * (matching runs are executed in memory and are not stored), so process-level
 * counters are reported as zero rather than filled with fabricated values.
 */

import { getDatabase } from '@/lib/db';
import { assignments, users } from '@/lib/db/schema';
import { count, eq } from 'drizzle-orm';

export interface AssignmentMonitoringStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  matchCount: number;
  nonMatchCount: number;
  overallProgress: number;
}

export interface EmployeeMonitoringProgress {
  employeeId: number;
  fullName: string;
  email: string;
  username: string;
  accountStatus: string;
  totalAssigned: number;
  completed: number;
  pending: number;
  inProgress: number;
  completionRate: number;
}

export interface MonitoringSummary {
  runningProcesses: number;
  completedProcesses: number;
  failedProcesses: number;
  totalEmployees: number;
  averageCompletionRate: number;
}

export interface MonitoringDashboardData {
  summary: MonitoringSummary;
  assignments: AssignmentMonitoringStats;
  employees: EmployeeMonitoringProgress[];
}

function toPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Build the full monitoring dashboard payload from live database rows.
 * Uses grouped counts so aggregation happens in the database, not the client.
 */
export async function getMonitoringDashboard(): Promise<MonitoringDashboardData> {
  const db = getDatabase();

  const [employeeUsers, statusRows, resultRows, perEmployeeRows] = await Promise.all([
    db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        username: users.username,
        status: users.status,
      })
      .from(users)
      .where(eq(users.role, 'EMPLOYEE'))
      .orderBy(users.fullName),
    db
      .select({ status: assignments.status, value: count() })
      .from(assignments)
      .groupBy(assignments.status),
    db
      .select({ verificationResult: assignments.verificationResult, value: count() })
      .from(assignments)
      .groupBy(assignments.verificationResult),
    db
      .select({
        employeeId: assignments.employeeId,
        status: assignments.status,
        verificationResult: assignments.verificationResult,
        value: count(),
      })
      .from(assignments)
      .groupBy(assignments.employeeId, assignments.status, assignments.verificationResult),
  ]);

  // Assignment lifecycle totals (PENDING / IN_PROGRESS / COMPLETED).
  let total = 0;
  let completed = 0;
  let pending = 0;
  let inProgress = 0;
  for (const row of statusRows) {
    const value = Number(row.value);
    total += value;
    if (row.status === 'COMPLETED') completed += value;
    else if (row.status === 'IN_PROGRESS') inProgress += value;
    else if (row.status === 'PENDING') pending += value;
  }

  // Verification outcome totals (MATCH / NON_MATCH).
  let matchCount = 0;
  let nonMatchCount = 0;
  for (const row of resultRows) {
    const value = Number(row.value);
    if (row.verificationResult === 'MATCH') matchCount += value;
    else if (row.verificationResult === 'NON_MATCH') nonMatchCount += value;
  }

  const assignmentStats: AssignmentMonitoringStats = {
    total,
    completed,
    pending,
    inProgress,
    matchCount,
    nonMatchCount,
    overallProgress: toPercentage(completed, total),
  };

  // Per-employee progress rows.
  const employees: EmployeeMonitoringProgress[] = employeeUsers.map((user) => ({
    employeeId: user.id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    accountStatus: user.status,
    totalAssigned: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    completionRate: 0,
  }));
  const employeeById = new Map(employees.map((employee) => [employee.employeeId, employee]));

  for (const row of perEmployeeRows) {
    const employee = employeeById.get(row.employeeId);
    if (!employee) continue;
    const value = Number(row.value);
    employee.totalAssigned += value;
    if (row.status === 'COMPLETED') employee.completed += value;
    else if (row.status === 'IN_PROGRESS') employee.inProgress += value;
    else if (row.status === 'PENDING') employee.pending += value;
  }
  for (const employee of employees) {
    employee.completionRate = toPercentage(employee.completed, employee.totalAssigned);
  }

  // Average completion across employees who actually hold assignments.
  const employeesWithWork = employees.filter((employee) => employee.totalAssigned > 0);
  const averageCompletionRate =
    employeesWithWork.length === 0
      ? 0
      : Math.round(
          employeesWithWork.reduce((sum, employee) => sum + employee.completionRate, 0) /
            employeesWithWork.length
        );

  const summary: MonitoringSummary = {
    // No persistent matching-process table exists yet, so there are genuinely
    // no stored running/completed/failed processes to report.
    runningProcesses: 0,
    completedProcesses: 0,
    failedProcesses: 0,
    totalEmployees: employees.length,
    averageCompletionRate,
  };

  return {
    summary,
    assignments: assignmentStats,
    employees,
  };
}
