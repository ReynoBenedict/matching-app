/**
 * History service (Riwayat Proses)
 * Reads the `audit_logs` table — the single source of truth for system activity —
 * with optional filters, aggregate counts, and pagination.
 *
 * No mock data: every value is read from audit_logs (joined to users for names).
 */

import { getDatabase } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';
import { and, count, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';

export interface HistoryEntry {
  id: number;
  action: string;
  entityType: string | null;
  entityId: number | null;
  metadata: Record<string, unknown> | null;
  userId: number | null;
  userName: string | null;
  createdAt: string;
}

export interface HistorySummary {
  total: number;
  matchingStarts: number;
  matchingCompletes: number;
  matchingFails: number;
  verifications: number;
  logins: number;
}

export interface HistoryFilterOptions {
  actions: string[];
  users: { id: number; name: string }[];
}

export interface HistoryQuery {
  action?: string;
  userId?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface HistoryResult {
  entries: HistoryEntry[];
  summary: HistorySummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: HistoryFilterOptions;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Convert a YYYY-MM-DD input into a local Date boundary.
 * Parsed manually to avoid the UTC interpretation of `new Date('YYYY-MM-DD')`.
 */
function toDateBoundary(value: string, endOfDay: boolean): Date | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = endOfDay
    ? new Date(year, month, day, 23, 59, 59, 999)
    : new Date(year, month, day, 0, 0, 0, 0);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toMetadata(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

interface HistoryEntryRow {
  id: number;
  action: string;
  entityType: string | null;
  entityId: number | null;
  metadata: unknown;
  userId: number | null;
  userName: string | null;
  createdAt: Date;
}

function mapHistoryEntry(row: HistoryEntryRow): HistoryEntry {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: toMetadata(row.metadata),
    userId: row.userId,
    userName: row.userName ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatMonthLabel(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  const name = MONTH_NAMES[Number(match[2]) - 1];
  return name ? `${name} ${match[1]}` : month;
}

export async function getHistory({
  action,
  userId,
  from,
  to,
  page = 1,
  limit = 10,
}: HistoryQuery = {}): Promise<HistoryResult> {
  const db = getDatabase();

  const conditions: SQL[] = [];
  if (action && action !== 'ALL') {
    conditions.push(eq(auditLogs.action, action));
  }
  if (typeof userId === 'number' && Number.isFinite(userId)) {
    conditions.push(eq(auditLogs.userId, userId));
  }

  const fromDate = from ? toDateBoundary(from, false) : null;
  const toDate = to ? toDateBoundary(to, true) : null;
  if (fromDate) conditions.push(gte(auditLogs.createdAt, fromDate));
  if (toDate) conditions.push(lte(auditLogs.createdAt, toDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const validLimit = Math.min(Math.max(1, limit), 100);
  const validPage = Math.max(1, page);
  const offset = (validPage - 1) * validLimit;

  const [grouped, entryRows, actionRows, userRows] = await Promise.all([
    db
      .select({ action: auditLogs.action, value: count() })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.action),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        metadata: auditLogs.metadata,
        userId: auditLogs.userId,
        userName: users.fullName,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.userId))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(validLimit)
      .offset(offset),
    db
      .selectDistinct({ action: auditLogs.action })
      .from(auditLogs)
      .orderBy(auditLogs.action),
    db
      .selectDistinct({ id: users.id, name: users.fullName })
      .from(auditLogs)
      .innerJoin(users, eq(users.id, auditLogs.userId))
      .orderBy(users.fullName),
  ]);

  // Summary counts are derived from the same filtered set.
  const counts = new Map<string, number>();
  let total = 0;
  for (const row of grouped) {
    const value = Number(row.value);
    counts.set(row.action, value);
    total += value;
  }

  const summary: HistorySummary = {
    total,
    matchingStarts: counts.get('MATCHING_START') ?? 0,
    matchingCompletes: counts.get('MATCHING_COMPLETE') ?? 0,
    matchingFails: counts.get('MATCHING_FAIL') ?? 0,
    verifications: counts.get('VERIFY_ASSIGNMENT') ?? 0,
    logins: counts.get('LOGIN') ?? 0,
  };

  const entries: HistoryEntry[] = entryRows.map(mapHistoryEntry);

  return {
    entries,
    summary,
    pagination: {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / validLimit)),
    },
    filters: {
      actions: actionRows.map((row) => row.action),
      users: userRows.map((row) => ({ id: row.id, name: row.name })),
    },
  };
}

/**
 * Most recent audit log entries (unfiltered). Used by dashboards.
 */
export async function getRecentActivities(limit = 5): Promise<HistoryEntry[]> {
  const db = getDatabase();
  const validLimit = Math.min(Math.max(1, limit), 50);

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      userId: auditLogs.userId,
      userName: users.fullName,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.userId))
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(validLimit);

  return rows.map(mapHistoryEntry);
}

export interface MonthlyActivity {
  month: string; // YYYY-MM
  label: string; // "September 2026"
  total: number;
}

/**
 * Real activity counts per month, derived from audit_logs timestamps.
 * Returns only months that actually have records.
 */
export async function getMonthlyActivity(): Promise<MonthlyActivity[]> {
  const db = getDatabase();

  const rows = await db
    .select({
      month: sql<string>`to_char(${auditLogs.createdAt}, 'YYYY-MM')`,
      value: count(),
    })
    .from(auditLogs)
    .groupBy(sql`to_char(${auditLogs.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${auditLogs.createdAt}, 'YYYY-MM') asc`);

  return rows.map((row) => ({
    month: row.month,
    label: formatMonthLabel(row.month),
    total: Number(row.value),
  }));
}

export interface ActivityByAction {
  action: string;
  total: number;
}

/**
 * Activity counts grouped by action, optionally bounded by a date range.
 */
export async function getActivityByAction(
  { from, to }: { from?: string; to?: string } = {}
): Promise<ActivityByAction[]> {
  const db = getDatabase();

  const conditions: SQL[] = [];
  const fromDate = from ? toDateBoundary(from, false) : null;
  const toDate = to ? toDateBoundary(to, true) : null;
  if (fromDate) conditions.push(gte(auditLogs.createdAt, fromDate));
  if (toDate) conditions.push(lte(auditLogs.createdAt, toDate));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({ action: auditLogs.action, value: count() })
    .from(auditLogs)
    .where(whereClause)
    .groupBy(auditLogs.action);

  return rows
    .map((row) => ({ action: row.action, total: Number(row.value) }))
    .sort((a, b) => b.total - a.total || a.action.localeCompare(b.action));
}
