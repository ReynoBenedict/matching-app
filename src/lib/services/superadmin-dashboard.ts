/**
 * Superadmin dashboard service
 * Every figure and activity is derived from the existing database tables.
 *
 * It reuses the Superadmin monitoring service (assignments/users/verification)
 * and the history service (audit_logs) instead of duplicating their logic, and
 * adds a few dataset aggregates — the same approach used by the Kepala BPS
 * dashboard service, so both dashboards stay consistent with the rest of the
 * application.
 *
 * Nothing is fabricated. There is currently NO persistent matching-process
 * table in the schema: matching runs execute in memory (see the matching job
 * registry) and are not stored historically, so this service does not expose
 * any "running/completed process" counters or process history. Activity shown
 * on the dashboard comes from the audit log, which is the only persisted
 * record of what the system actually did.
 */

import { getDatabase } from '@/lib/db';
import { datasetRecords, datasets, users } from '@/lib/db/schema';
import { and, count, eq } from 'drizzle-orm';
import { getMonitoringDashboard } from '@/lib/services/monitoring';
import {
  getMonthlyActivity,
  getRecentActivities,
  type HistoryEntry,
  type MonthlyActivity,
} from '@/lib/services/history';

export interface SuperadminDashboardData {
  datasets: {
    total: number;
    ready: number;
    totalRecords: number;
  };
  users: {
    total: number;
    activeEmployees: number;
  };
  assignments: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overallProgress: number;
  };
  verification: {
    /** Persisted candidate pairs (the `assignments` table). */
    totalCandidates: number;
    verified: number;
    unverified: number;
    matchCount: number;
    nonMatchCount: number;
    /** MATCH / (MATCH + NON_MATCH), 0 when nothing is verified. */
    matchRate: number;
  };
  monthlyActivity: MonthlyActivity[];
  recentActivities: HistoryEntry[];
}

function toPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export async function getSuperadminDashboard(): Promise<SuperadminDashboardData> {
  const db = getDatabase();

  const [
    monitoring,
    recentActivities,
    monthlyActivity,
    datasetStatusRows,
    recordTotalRows,
    userTotalRows,
    activeEmployeeRows,
  ] = await Promise.all([
    getMonitoringDashboard(),
    getRecentActivities(6),
    getMonthlyActivity(),
    db
      .select({ status: datasets.status, value: count() })
      .from(datasets)
      .groupBy(datasets.status),
    db.select({ value: count() }).from(datasetRecords),
    db.select({ value: count() }).from(users),
    db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, 'EMPLOYEE'), eq(users.status, 'ACTIVE'))),
  ]);

  let datasetTotal = 0;
  let datasetReady = 0;
  for (const row of datasetStatusRows) {
    const value = Number(row.value);
    datasetTotal += value;
    if (row.status === 'READY') datasetReady += value;
  }

  const matchCount = monitoring.assignments.matchCount;
  const nonMatchCount = monitoring.assignments.nonMatchCount;
  const verified = matchCount + nonMatchCount;
  const totalCandidates = monitoring.assignments.total;

  return {
    datasets: {
      total: datasetTotal,
      ready: datasetReady,
      totalRecords: Number(recordTotalRows[0]?.value ?? 0),
    },
    users: {
      total: Number(userTotalRows[0]?.value ?? 0),
      activeEmployees: Number(activeEmployeeRows[0]?.value ?? 0),
    },
    assignments: {
      total: monitoring.assignments.total,
      completed: monitoring.assignments.completed,
      pending: monitoring.assignments.pending,
      inProgress: monitoring.assignments.inProgress,
      overallProgress: monitoring.assignments.overallProgress,
    },
    verification: {
      totalCandidates,
      verified,
      unverified: totalCandidates - verified,
      matchCount,
      nonMatchCount,
      // Denominator is verified candidates only; 0 when there is nothing to divide.
      matchRate: toPercentage(matchCount, verified),
    },
    monthlyActivity,
    recentActivities,
  };
}
