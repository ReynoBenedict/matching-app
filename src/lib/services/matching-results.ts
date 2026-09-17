/**
 * Database-backed matching result reader.
 *
 * Matching candidates are persisted by the matching job. This service never
 * reruns the matching engine merely to render a results/assignment page.
 * Pagination is performed in PostgreSQL so only the requested page reaches the
 * browser.
 */

import { getDatabase } from '@/lib/db';
import {
  assignments,
  datasetRecords,
  datasets,
  matchingCandidates,
  matchingRuns,
  users,
} from '@/lib/db/schema';
import { and, count, desc, eq, inArray } from 'drizzle-orm';

export type AssignmentLifecycleStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type VerificationOutcome = 'MATCH' | 'NON_MATCH' | 'REVIEW';

export interface CandidateFieldScore {
  columnA: string;
  columnB: string;
  score: number;
}

export interface CandidateRecordSummary {
  id: number;
  datasetId: number;
  datasetName: string | null;
  idsbr: string;
  namaUsaha: string | null;
  alamatUsaha: string | null;
  nmprov: string | null;
  nmkab: string | null;
  nmkec: string | null;
  nmdesa: string | null;
  latitude: string | null;
  longitude: string | null;
  latitudeGc: string | null;
  longitudeGc: string | null;
  rawData: Record<string, unknown>;
}

export interface MatchingCandidateRow {
  matchingRunId: number;
  recordAId: number;
  recordBId: number;
  idsbrA: string;
  idsbrB: string;
  overallScore: number;
  tfidfSimilarity: number | null;
  faissSimilarity: number | null;
  rapidfuzzSimilarity: number | null;
  fieldScores: CandidateFieldScore[];
  recordA: CandidateRecordSummary | null;
  recordB: CandidateRecordSummary | null;
  assigned: boolean;
  assignmentId: number | null;
  assignmentStatus: AssignmentLifecycleStatus | null;
  verificationResult: VerificationOutcome | null;
  verificationNote: string | null;
  verifiedAt: string | null;
  assignedEmployee: { id: number; fullName: string } | null;
}

export interface MatchingCandidateSummary {
  totalCandidates: number;
  assigned: number;
  unassigned: number;
  verified: number;
  unverified: number;
  matchCount: number;
  nonMatchCount: number;
  reviewCount: number;
  matchPercent: number;
}

export interface MatchingCandidatesResult {
  datasetA: { id: number; name: string };
  datasetB: { id: number; name: string };
  threshold: number;
  summary: MatchingCandidateSummary;
  rows: MatchingCandidateRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export type MatchingCandidatesResponse =
  | { success: true; data: MatchingCandidatesResult }
  | { success: false; error: string };

function toRecordSummary(
  record: typeof datasetRecords.$inferSelect | undefined,
  datasetNames: Map<number, string>,
): CandidateRecordSummary | null {
  if (!record) return null;
  return {
    id: record.id,
    datasetId: record.datasetId,
    datasetName: datasetNames.get(record.datasetId) ?? null,
    idsbr: record.idsbr,
    namaUsaha: record.namaUsaha,
    alamatUsaha: record.alamatUsaha,
    nmprov: record.nmprov,
    nmkab: record.nmkab,
    nmkec: record.nmkec,
    nmdesa: record.nmdesa,
    latitude: record.latitude,
    longitude: record.longitude,
    latitudeGc: record.latitudeGc,
    longitudeGc: record.longitudeGc,
    rawData: (record.rawData ?? {}) as Record<string, unknown>,
  };
}

export async function getMatchingCandidatesByRun(
  matchingRunId: number,
  page = 1,
  limit = 20,
): Promise<MatchingCandidatesResponse> {
  const db = getDatabase();
  const validLimit = Math.min(100, Math.max(1, Number.isFinite(limit) ? Math.floor(limit) : 20));
  const validPage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1);
  const offset = (validPage - 1) * validLimit;

  const [run] = await db.select().from(matchingRuns).where(eq(matchingRuns.id, matchingRunId)).limit(1);
  if (!run) return { success: false, error: 'Hasil matching tidak ditemukan.' };

  const datasetRows = await db
    .select({ id: datasets.id, name: datasets.name })
    .from(datasets)
    .where(inArray(datasets.id, [run.datasetAId, run.datasetBId]));
  const datasetNames = new Map(datasetRows.map((d) => [d.id, d.name]));
  const datasetAName = datasetNames.get(run.datasetAId);
  const datasetBName = datasetNames.get(run.datasetBId);
  if (!datasetAName || !datasetBName) return { success: false, error: 'Dataset pada hasil matching tidak ditemukan.' };

  const [{ value: totalCandidates }] = await db
    .select({ value: count() })
    .from(matchingCandidates)
    .where(eq(matchingCandidates.matchingRunId, matchingRunId));

  const [{ value: assigned }] = await db
    .select({ value: count() })
    .from(assignments)
    .where(eq(assignments.matchingRunId, matchingRunId));

  const [{ value: verified }] = await db
    .select({ value: count() })
    .from(assignments)
    .where(and(eq(assignments.matchingRunId, matchingRunId), eq(assignments.status, 'COMPLETED')));

  const [{ value: matchCount }] = await db
    .select({ value: count() })
    .from(assignments)
    .where(and(eq(assignments.matchingRunId, matchingRunId), eq(assignments.verificationResult, 'MATCH')));

  const [{ value: nonMatchCount }] = await db
    .select({ value: count() })
    .from(assignments)
    .where(and(eq(assignments.matchingRunId, matchingRunId), eq(assignments.verificationResult, 'NON_MATCH')));

  const [{ value: reviewCount }] = await db
    .select({ value: count() })
    .from(assignments)
    .where(and(eq(assignments.matchingRunId, matchingRunId), eq(assignments.verificationResult, 'REVIEW')));

  const pageCandidates = await db
    .select()
    .from(matchingCandidates)
    .where(eq(matchingCandidates.matchingRunId, matchingRunId))
    .orderBy(desc(matchingCandidates.overallScore), matchingCandidates.id)
    .limit(validLimit)
    .offset(offset);

  const pageRecordIds = [...new Set(pageCandidates.flatMap((c) => [c.recordAId, c.recordBId]))];
  const recordRows = pageRecordIds.length
    ? await db.select().from(datasetRecords).where(inArray(datasetRecords.id, pageRecordIds))
    : [];
  const recordMap = new Map(recordRows.map((r) => [r.id, r]));

  const pageAIds = [...new Set(pageCandidates.map((c) => c.recordAId))];
  const pageBIds = [...new Set(pageCandidates.map((c) => c.recordBId))];
  const assignmentRows = pageAIds.length && pageBIds.length
    ? await db
        .select({
          id: assignments.id,
          matchingRunId: assignments.matchingRunId,
          recordAId: assignments.recordAId,
          recordBId: assignments.recordBId,
          employeeId: assignments.employeeId,
          status: assignments.status,
          verificationResult: assignments.verificationResult,
          verificationNote: assignments.verificationNote,
          verifiedAt: assignments.verifiedAt,
        })
        .from(assignments)
        .where(and(eq(assignments.matchingRunId, matchingRunId), inArray(assignments.recordAId, pageAIds), inArray(assignments.recordBId, pageBIds)))
    : [];

  const employeeIds = [...new Set(assignmentRows.map((a) => a.employeeId))];
  const employeeRows = employeeIds.length
    ? await db.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, employeeIds))
    : [];
  const employeeMap = new Map(employeeRows.map((e) => [e.id, e.fullName]));
  const assignmentMap = new Map(assignmentRows.map((a) => [`${a.recordAId}-${a.recordBId}`, a]));

  const rows: MatchingCandidateRow[] = pageCandidates.map((candidate) => {
    const assignment = assignmentMap.get(`${candidate.recordAId}-${candidate.recordBId}`);
    return {
      matchingRunId,
      recordAId: candidate.recordAId,
      recordBId: candidate.recordBId,
      idsbrA: candidate.idsbrA,
      idsbrB: candidate.idsbrB,
      overallScore: Number(candidate.overallScore),
      tfidfSimilarity: candidate.tfidfSimilarity == null ? null : Number(candidate.tfidfSimilarity),
      faissSimilarity: candidate.faissSimilarity == null ? null : Number(candidate.faissSimilarity),
      rapidfuzzSimilarity: candidate.rapidfuzzSimilarity == null
        ? (Array.isArray(candidate.fieldScores) && candidate.fieldScores.length ? Number(candidate.overallScore) : null)
        : Number(candidate.rapidfuzzSimilarity),
      fieldScores: Array.isArray(candidate.fieldScores) ? candidate.fieldScores as CandidateFieldScore[] : [],
      recordA: toRecordSummary(recordMap.get(candidate.recordAId), datasetNames),
      recordB: toRecordSummary(recordMap.get(candidate.recordBId), datasetNames),
      assigned: Boolean(assignment),
      assignmentId: assignment?.id ?? null,
      assignmentStatus: assignment?.status ?? null,
      verificationResult: assignment?.verificationResult ?? null,
      verificationNote: assignment?.verificationNote ?? null,
      verifiedAt: assignment?.verifiedAt?.toISOString() ?? null,
      assignedEmployee: assignment ? { id: assignment.employeeId, fullName: employeeMap.get(assignment.employeeId) ?? '-' } : null,
    };
  });

  const total = Number(totalCandidates);
  const verifiedTotal = Number(verified);
  return {
    success: true,
    data: {
      datasetA: { id: run.datasetAId, name: datasetAName },
      datasetB: { id: run.datasetBId, name: datasetBName },
      threshold: Number(run.threshold),
      summary: {
        totalCandidates: total,
        assigned: Number(assigned),
        unassigned: total - Number(assigned),
        verified: verifiedTotal,
        unverified: total - verifiedTotal,
        matchCount: Number(matchCount),
        nonMatchCount: Number(nonMatchCount),
        reviewCount: Number(reviewCount),
        matchPercent: verifiedTotal === 0 ? 0 : Math.round((Number(matchCount) / verifiedTotal) * 100),
      },
      rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / validLimit)),
      },
    },
  };
}

export async function getMatchingCandidates({
  datasetAId,
  datasetBId,
  threshold,
  page = 1,
  limit = 20,
}: {
  datasetAId: number;
  datasetBId: number;
  threshold: number;
  page?: number;
  limit?: number;
}): Promise<MatchingCandidatesResponse> {
  const db = getDatabase();
  const [latestRun] = await db
    .select({ id: matchingRuns.id })
    .from(matchingRuns)
    .where(and(eq(matchingRuns.datasetAId, datasetAId), eq(matchingRuns.datasetBId, datasetBId), eq(matchingRuns.threshold, threshold.toFixed(4))))
    .orderBy(desc(matchingRuns.createdAt))
    .limit(1);
  if (!latestRun) return { success: false, error: 'Belum ada hasil matching tersimpan untuk pasangan dataset dan threshold tersebut.' };
  return getMatchingCandidatesByRun(latestRun.id, page, limit);
}
