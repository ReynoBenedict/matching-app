/**
 * Matching Results service (Phase 6B)
 * Produces the FULL candidate set from the matching process and merges it with
 * the persisted assignment/verification data.
 *
 * Candidates themselves are not persisted by the matching provider; only the
 * candidates that were assigned to an employee are stored (the `assignments`
 * table). This service therefore re-runs the EXISTING matching provider for the
 * selected dataset pair + threshold, then left-joins the stored assignments and
 * verification results on (recordAId, recordBId). No algorithm changes and no
 * new tables are introduced.
 */

import { getDatabase } from '@/lib/db';
import { assignments, datasetColumns, datasetRecords, datasets, users } from '@/lib/db/schema';
import { and, inArray } from 'drizzle-orm';
import { getMatchingProvider } from '@/lib/services/matching';
import type { ColumnMapping } from '@/lib/services/matching/provider';

export type AssignmentLifecycleStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type VerificationOutcome = 'MATCH' | 'NON_MATCH';

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
  namaUsaha: string;
  alamatUsaha: string;
  nmprov: string;
  nmkab: string;
}

export interface MatchingCandidateRow {
  recordAId: number;
  recordBId: number;
  idsbrA: string;
  idsbrB: string;
  overallScore: number;
  fieldScores: CandidateFieldScore[];
  recordA: CandidateRecordSummary | null;
  recordB: CandidateRecordSummary | null;
  assigned: boolean;
  assignmentId: number | null;
  assignmentStatus: AssignmentLifecycleStatus | null;
  verificationResult: VerificationOutcome | null;
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
  matchPercent: number;
}

export interface MatchingCandidatesResult {
  datasetA: { id: number; name: string };
  datasetB: { id: number; name: string };
  threshold: number;
  summary: MatchingCandidateSummary;
  rows: MatchingCandidateRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type MatchingCandidatesResponse =
  | { success: true; data: MatchingCandidatesResult }
  | { success: false; error: string };

/**
 * Shared columns between two datasets, mapped by identical column name.
 * This mirrors the mapping used by the Penugasan page, so the candidate pairs
 * produced here are identical to the pairs that can be assigned there.
 */
async function resolveColumnMappings(
  datasetAId: number,
  datasetBId: number
): Promise<ColumnMapping[]> {
  const db = getDatabase();

  const columnRows = await db
    .select({ datasetId: datasetColumns.datasetId, columnName: datasetColumns.columnName })
    .from(datasetColumns)
    .where(inArray(datasetColumns.datasetId, [datasetAId, datasetBId]));

  const columnsA = columnRows
    .filter((column) => column.datasetId === datasetAId)
    .map((column) => column.columnName);
  const columnsB = new Set(
    columnRows
      .filter((column) => column.datasetId === datasetBId)
      .map((column) => column.columnName)
  );

  return columnsA
    .filter((columnName) => columnsB.has(columnName))
    .map((columnName) => ({ columnA: columnName, columnB: columnName }));
}

/**
 * Compute the full candidate set for a dataset pair + threshold and merge it
 * with stored assignment/verification data.
 */
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

  if (datasetAId === datasetBId) {
    return { success: false, error: 'Dataset A dan Dataset B harus berbeda.' };
  }

  const datasetRows = await db
    .select({ id: datasets.id, name: datasets.name })
    .from(datasets)
    .where(inArray(datasets.id, [datasetAId, datasetBId]));

  const datasetA = datasetRows.find((dataset) => dataset.id === datasetAId) ?? null;
  const datasetB = datasetRows.find((dataset) => dataset.id === datasetBId) ?? null;
  if (!datasetA || !datasetB) {
    return { success: false, error: 'Dataset tidak ditemukan.' };
  }

  const columnMappings = await resolveColumnMappings(datasetAId, datasetBId);
  if (columnMappings.length === 0) {
    return {
      success: false,
      error: 'Kedua dataset tidak memiliki kolom yang sama untuk dipetakan.',
    };
  }

  // Run the existing matching provider — no algorithm changes.
  const provider = getMatchingProvider();
  const matching = await provider.runMatching({
    datasetAId,
    datasetBId,
    columnMappings,
    threshold,
  });

  if (!matching.success || !matching.data) {
    return { success: false, error: matching.error || 'Gagal menjalankan pencocokan.' };
  }

  const candidates = matching.data.candidates;

  // Stored assignments for every candidate pair (needed for the summary counts).
  const candidateRecordAIds = [...new Set(candidates.map((candidate) => candidate.recordAId))];
  const candidateRecordBIds = [...new Set(candidates.map((candidate) => candidate.recordBId))];

  const assignmentRows =
    candidateRecordAIds.length > 0 && candidateRecordBIds.length > 0
      ? await db
          .select({
            id: assignments.id,
            recordAId: assignments.recordAId,
            recordBId: assignments.recordBId,
            employeeId: assignments.employeeId,
            status: assignments.status,
            verificationResult: assignments.verificationResult,
            verifiedAt: assignments.verifiedAt,
          })
          .from(assignments)
          .where(
            and(
              inArray(assignments.recordAId, candidateRecordAIds),
              inArray(assignments.recordBId, candidateRecordBIds)
            )
          )
      : [];

  const assignmentMap = new Map(assignmentRows.map((assignment) => [
    `${assignment.recordAId}-${assignment.recordBId}`,
    assignment,
  ]));

  const employeeIds = [
    ...new Set(assignmentRows.map((assignment) => assignment.employeeId)),
  ];
  const employeeRows = employeeIds.length
    ? await db
        .select({ id: users.id, fullName: users.fullName })
        .from(users)
        .where(inArray(users.id, employeeIds))
    : [];
  const employeeMap = new Map(employeeRows.map((employee) => [employee.id, employee.fullName]));

  // Summary counts are based on ALL candidates, not just the current page.
  let assigned = 0;
  let verified = 0;
  let matchCount = 0;
  let nonMatchCount = 0;
  for (const candidate of candidates) {
    const assignment = assignmentMap.get(`${candidate.recordAId}-${candidate.recordBId}`);
    if (!assignment) continue;
    assigned += 1;
    if (assignment.verificationResult === 'MATCH') {
      verified += 1;
      matchCount += 1;
    } else if (assignment.verificationResult === 'NON_MATCH') {
      verified += 1;
      nonMatchCount += 1;
    }
  }

  const totalCandidates = candidates.length;
  const summary: MatchingCandidateSummary = {
    totalCandidates,
    assigned,
    unassigned: totalCandidates - assigned,
    verified,
    unverified: totalCandidates - verified,
    matchCount,
    nonMatchCount,
    // Percentage over VERIFIED candidates only; 0 when nothing is verified.
    matchPercent: verified === 0 ? 0 : Math.round((matchCount / verified) * 100),
  };

  // Paginate for the table.
  const validLimit = Math.min(Math.max(1, limit), 100);
  const validPage = Math.max(1, page);
  const offset = (validPage - 1) * validLimit;
  const pageCandidates = candidates.slice(offset, offset + validLimit);

  // Resolve record details for the current page only.
  const pageRecordIds = [
    ...new Set(pageCandidates.flatMap((candidate) => [candidate.recordAId, candidate.recordBId])),
  ];
  const recordRows = pageRecordIds.length
    ? await db
        .select({
          id: datasetRecords.id,
          datasetId: datasetRecords.datasetId,
          idsbr: datasetRecords.idsbr,
          namaUsaha: datasetRecords.namaUsaha,
          alamatUsaha: datasetRecords.alamatUsaha,
          nmprov: datasetRecords.nmprov,
          nmkab: datasetRecords.nmkab,
        })
        .from(datasetRecords)
        .where(inArray(datasetRecords.id, pageRecordIds))
    : [];
  const recordMap = new Map(recordRows.map((record) => [record.id, record]));

  const toRecordSummary = (recordId: number): CandidateRecordSummary | null => {
    const record = recordMap.get(recordId);
    if (!record) return null;
    const datasetName = record.datasetId === datasetAId ? datasetA.name : datasetB.name;
    return {
      id: record.id,
      datasetId: record.datasetId,
      datasetName,
      idsbr: record.idsbr,
      namaUsaha: record.namaUsaha,
      alamatUsaha: record.alamatUsaha,
      nmprov: record.nmprov,
      nmkab: record.nmkab,
    };
  };

  const rows: MatchingCandidateRow[] = pageCandidates.map((candidate) => {
    const assignment = assignmentMap.get(`${candidate.recordAId}-${candidate.recordBId}`) ?? null;
    const employeeName = assignment ? employeeMap.get(assignment.employeeId) ?? null : null;
    return {
      recordAId: candidate.recordAId,
      recordBId: candidate.recordBId,
      idsbrA: candidate.idsbrA,
      idsbrB: candidate.idsbrB,
      overallScore: candidate.overallScore,
      fieldScores: candidate.fieldScores,
      recordA: toRecordSummary(candidate.recordAId),
      recordB: toRecordSummary(candidate.recordBId),
      assigned: Boolean(assignment),
      assignmentId: assignment?.id ?? null,
      assignmentStatus: assignment?.status ?? null,
      verificationResult: assignment?.verificationResult ?? null,
      verifiedAt: assignment?.verifiedAt ? assignment.verifiedAt.toISOString() : null,
      assignedEmployee:
        assignment && employeeName != null ? { id: assignment.employeeId, fullName: employeeName } : null,
    };
  });

  return {
    success: true,
    data: {
      datasetA: { id: datasetA.id, name: datasetA.name },
      datasetB: { id: datasetB.id, name: datasetB.name },
      threshold,
      summary,
      rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: totalCandidates,
        totalPages: Math.max(1, Math.ceil(totalCandidates / validLimit)),
      },
    },
  };
}
