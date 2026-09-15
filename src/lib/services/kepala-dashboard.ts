/**
 * Kepala BPS dashboard service
 * Read-only executive summary built entirely from existing database data.
 *
 * It reuses the Superadmin monitoring service (assignments/users) and the
 * history service (audit_logs) rather than duplicating their logic, and adds a
 * few dataset aggregates. Nothing is fabricated: metrics that cannot be derived
 * from the schema (accuracy, average completion time, uptime) are not produced.
 */

import { getDatabase } from '@/lib/db';
import { datasets, datasetRecords, users } from '@/lib/db/schema';
import { and, count, eq } from 'drizzle-orm';
import {
  getMonitoringDashboard,
  type EmployeeMonitoringProgress,
} from '@/lib/services/monitoring';
import {
  getMonthlyActivity,
  getRecentActivities,
  type HistoryEntry,
  type MonthlyActivity,
} from '@/lib/services/history';

export interface KepalaDashboardData {
  verification: {
    totalCandidates: number;
    verified: number;
    unverified: number;
    matchCount: number;
    nonMatchCount: number;
    verificationRate: number;
    matchRate: number;
  };
  assignments: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overallProgress: number;
  };
  employees: {
    activeCount: number;
    averageCompletionRate: number;
    rows: EmployeeMonitoringProgress[];
  };
  datasets: {
    total: number;
    ready: number;
    totalRecords: number;
  };
  monthlyActivity: MonthlyActivity[];
  recentActivities: HistoryEntry[];
}

function toPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export async function getKepalaDashboard(): Promise<KepalaDashboardData> {
  const db = getDatabase();

  const [
    monitoring,
    recentActivities,
    monthlyActivity,
    datasetTotalRows,
    datasetReadyRows,
    recordTotalRows,
    activeEmployeeRows,
  ] = await Promise.all([
    getMonitoringDashboard(),
    getRecentActivities(6),
    getMonthlyActivity(),
    db.select({ value: count() }).from(datasets),
    db.select({ value: count() }).from(datasets).where(eq(datasets.status, 'READY')),
    db.select({ value: count() }).from(datasetRecords),
    db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, 'EMPLOYEE'), eq(users.status, 'ACTIVE'))),
  ]);

  const totalCandidates = monitoring.assignments.total;
  const matchCount = monitoring.assignments.matchCount;
  const nonMatchCount = monitoring.assignments.nonMatchCount;
  const verified = matchCount + nonMatchCount;

  return {
    verification: {
      totalCandidates,
      verified,
      unverified: totalCandidates - verified,
      matchCount,
      nonMatchCount,
      verificationRate: toPercentage(verified, totalCandidates),
      matchRate: toPercentage(matchCount, verified),
    },
    assignments: {
      total: monitoring.assignments.total,
      completed: monitoring.assignments.completed,
      pending: monitoring.assignments.pending,
      inProgress: monitoring.assignments.inProgress,
      overallProgress: monitoring.assignments.overallProgress,
    },
    employees: {
      activeCount: Number(activeEmployeeRows[0]?.value ?? 0),
      averageCompletionRate: monitoring.summary.averageCompletionRate,
      rows: monitoring.employees,
    },
    datasets: {
      total: Number(datasetTotalRows[0]?.value ?? 0),
      ready: Number(datasetReadyRows[0]?.value ?? 0),
      totalRecords: Number(recordTotalRows[0]?.value ?? 0),
    },
    monthlyActivity,
    recentActivities,
  };
}
