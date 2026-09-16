import { getDatabase } from '@/lib/db';
import { matchingCandidates, matchingRuns } from '@/lib/db/schema';
import type { MatchingRequest, MatchingResponse } from './provider';

export async function persistMatchingResult(
  createdBy: number,
  request: MatchingRequest,
  response: NonNullable<MatchingResponse['data']>
): Promise<number> {
  const db = getDatabase();
  const run = await db.insert(matchingRuns).values({
    datasetAId: request.datasetAId,
    datasetBId: request.datasetBId,
    threshold: request.threshold.toFixed(4),
    columnMappings: request.columnMappings,
    status: 'COMPLETED',
    createdBy,
    totalCandidates: response.candidates.length,
    completedAt: new Date(),
  }).returning({ id: matchingRuns.id });

  const runId = run[0]?.id;
  if (!runId) throw new Error('Gagal menyimpan matching run');

  const batchSize = 1000;
  for (let i = 0; i < response.candidates.length; i += batchSize) {
    const batch = response.candidates.slice(i, i + batchSize).map((candidate) => ({
      matchingRunId: runId,
      recordAId: candidate.recordAId,
      recordBId: candidate.recordBId,
      idsbrA: candidate.idsbrA || '',
      idsbrB: candidate.idsbrB || '',
      overallScore: candidate.overallScore.toFixed(4),
      tfidfSimilarity: candidate.tfidfSimilarity?.toFixed(4) ?? null,
      faissSimilarity: candidate.faissSimilarity?.toFixed(4) ?? null,
      rapidfuzzSimilarity: candidate.rapidfuzzSimilarity?.toFixed(4) ?? null,
      fieldScores: candidate.fieldScores,
    }));
    if (batch.length) await db.insert(matchingCandidates).values(batch);
  }

  return runId;
}
