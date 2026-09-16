/**
 * Hasil Akhir service (Kepala BPS, read-only)
 * Final results of candidate verification, built from the persisted matching
 * results (assignments) joined with their records, datasets, and employee.
 *
 * No mock data and no fabricated process history: everything is read from the
 * existing database (assignments, dataset_records, datasets, users).
 */

import { getDatabase } from '@/lib/db';
import { assignments, datasetRecords, datasets, users } from '@/lib/db/schema';
import { and, count, desc, eq, inArray, isNull, sql, type SQL } from 'drizzle-orm';

export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type VerificationOutcome = 'MATCH' | 'NON_MATCH' | 'REVIEW';
export type VerificationFilter = 'ALL' | 'MATCH' | 'NON_MATCH' | 'REVIEW' | 'UNVERIFIED';

export interface RecordBrief {
  id: number;
  datasetId: number;
  datasetName: string | null;
  idsbr: string;
  namaUsaha: string;
}

export interface FinalResultRow {
  assignmentId: number;
  similarityScore: string;
  status: AssignmentStatus;
  verificationResult: VerificationOutcome | null;
  verifiedAt: string | null;
  employee: { id: number; fullName: string } | null;
  recordA: RecordBrief | null;
  recordB: RecordBrief | null;
}

export interface FinalResultSummary {
  totalCandidates: number;
  matchCount: number;
  nonMatchCount: number;
  reviewCount: number;
  unverified: number;
  verificationRate: number;
}

export interface FinalResultsData {
  summary: FinalResultSummary;
  rows: FinalResultRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Global summary over every persisted candidate (independent of the table filter).
 */
export async function getFinalResultSummary(): Promise<FinalResultSummary> {
  const db = getDatabase();

  const resultRows = await db
    .select({ verificationResult: assignments.verificationResult, value: count() })
    .from(assignments)
    .groupBy(assignments.verificationResult);

  let totalCandidates = 0;
  let matchCount = 0;
  let nonMatchCount = 0;
  let reviewCount = 0;
  for (const row of resultRows) {
    const value = Number(row.value);
    totalCandidates += value;
    if (row.verificationResult === 'MATCH') matchCount += value;
    else if (row.verificationResult === 'NON_MATCH') nonMatchCount += value;
    else if (row.verificationResult === 'REVIEW') reviewCount += value;
  }

  const verified = matchCount + nonMatchCount;

  return {
    totalCandidates,
    matchCount,
    nonMatchCount,
    reviewCount,
    unverified: totalCandidates - verified,
    verificationRate: totalCandidates === 0 ? 0 : Math.round((verified / totalCandidates) * 100),
  };
}

export async function getFinalResults(
  { page = 1, limit = 20, verification = 'ALL' }: {
    page?: number;
    limit?: number;
    verification?: VerificationFilter;
  } = {}
): Promise<FinalResultsData> {
  const db = getDatabase();
  const validLimit = Math.min(Math.max(1, limit), 100);
  const validPage = Math.max(1, page);
  const offset = (validPage - 1) * validLimit;

  const summary = await getFinalResultSummary();

  const filters: SQL[] = [];
  if (verification === 'MATCH') filters.push(eq(assignments.verificationResult, 'MATCH'));
  else if (verification === 'NON_MATCH') filters.push(eq(assignments.verificationResult, 'NON_MATCH'));
  else if (verification === 'REVIEW') filters.push(eq(assignments.verificationResult, 'REVIEW'));
  else if (verification === 'UNVERIFIED') filters.push(isNull(assignments.verificationResult));
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [totalRows, rows] = await Promise.all([
    db.select({ value: count() }).from(assignments).where(whereClause),
    db
      .select({
        assignmentId: assignments.id,
        recordAId: assignments.recordAId,
        recordBId: assignments.recordBId,
        similarityScore: assignments.similarityScore,
        status: assignments.status,
        verificationResult: assignments.verificationResult,
        verifiedAt: assignments.verifiedAt,
        employeeId: users.id,
        employeeName: users.fullName,
      })
      .from(assignments)
      .leftJoin(users, eq(users.id, assignments.employeeId))
      .where(whereClause)
      .orderBy(sql`${assignments.verifiedAt} DESC NULLS LAST`, desc(assignments.id))
      .limit(validLimit)
      .offset(offset),
  ]);

  const total = Number(totalRows[0]?.value ?? 0);

  const recordIds = [...new Set(rows.flatMap((row) => [row.recordAId, row.recordBId]))];
  const recordMap = new Map<number, RecordBrief>();
  const datasetMap = new Map<number, string>();

  if (recordIds.length > 0) {
    const recordRows = await db
      .select({
        id: datasetRecords.id,
        datasetId: datasetRecords.datasetId,
        idsbr: datasetRecords.idsbr,
        namaUsaha: datasetRecords.namaUsaha,
      })
      .from(datasetRecords)
      .where(inArray(datasetRecords.id, recordIds));

    const datasetIds = [...new Set(recordRows.map((record) => record.datasetId))];
    const datasetRows = datasetIds.length
      ? await db
          .select({ id: datasets.id, name: datasets.name })
          .from(datasets)
          .where(inArray(datasets.id, datasetIds))
      : [];
    for (const dataset of datasetRows) datasetMap.set(dataset.id, dataset.name);

    for (const record of recordRows) {
      recordMap.set(record.id, {
        id: record.id,
        datasetId: record.datasetId,
        datasetName: datasetMap.get(record.datasetId) ?? null,
        idsbr: record.idsbr,
        namaUsaha: record.namaUsaha ?? '',
      });
    }
  }

  const enriched: FinalResultRow[] = rows.map((row) => ({
    assignmentId: row.assignmentId,
    similarityScore: row.similarityScore,
    status: row.status,
    verificationResult: row.verificationResult,
    verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : null,
    employee:
      row.employeeId != null && row.employeeName
        ? { id: row.employeeId, fullName: row.employeeName }
        : null,
    recordA: recordMap.get(row.recordAId) ?? null,
    recordB: recordMap.get(row.recordBId) ?? null,
  }));

  return {
    summary,
    rows: enriched,
    pagination: {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / validLimit)),
    },
  };
}
