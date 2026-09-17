/**
 * Matching Provider Interface
 *
 * Defines the contract that matching providers must implement.
 * This allows swapping between development/testing providers and
 * the production Model Service without changing the application layer.
 *
 * SRS: According to the system architecture, matching is owned by the
 * Model Service (external service running on port 8000). This interface
 * allows the application to use a development fallback for now while
 * maintaining the correct architectural boundary.
 */

export interface ColumnMapping {
  columnA: string;
  columnB: string;
}

export interface MatchingRequest {
  datasetAId: number;
  datasetBId: number;
  columnMappings: ColumnMapping[];
  threshold: number;
}

export interface FieldScore {
  columnA: string;
  columnB: string;
  score: number;
}

export interface CandidatePair {
  /** Similarity metrics are optional for legacy/fallback providers. */
  tfidfSimilarity?: number;
  faissSimilarity?: number;
  rapidfuzzSimilarity?: number;
  recordAId: number;
  recordBId: number;
  idsbrA: string;
  idsbrB: string;
  fieldScores: FieldScore[];
  overallScore: number;
}

export interface MatchingResponse {
  success: boolean;
  data?: {
    datasetA: { id: number; name: string };
    datasetB: { id: number; name: string };
    config: {
      columnMappings: ColumnMapping[];
      threshold: number;
    };
    summary: {
      totalCandidates: number;
    };
    candidates: CandidatePair[];
  };
  error?: string;
}

export interface IMatchingProvider {
  /**
   * Validate a matching request before execution
   */
  validateRequest(req: MatchingRequest): Promise<{ valid: boolean; error?: string }>;

  /**
   * Run matching and return candidates
   */
  runMatching(req: MatchingRequest): Promise<MatchingResponse>;
}

/**
 * Runtime guard for a matching response payload.
 *
 * A provider must never be trusted to return a well-formed body: an external
 * Model Service can reply with a truncated, empty, or unexpected JSON document.
 * Callers use this to reject malformed payloads instead of persisting or
 * displaying fabricated results.
 */
export function isMatchingResponseData(
  value: unknown
): value is NonNullable<MatchingResponse['data']> {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;

  const datasetA = data.datasetA as Record<string, unknown> | undefined;
  const datasetB = data.datasetB as Record<string, unknown> | undefined;
  const config = data.config as Record<string, unknown> | undefined;
  const summary = data.summary as Record<string, unknown> | undefined;

  if (!datasetA || typeof datasetA.id !== 'number') return false;
  if (!datasetB || typeof datasetB.id !== 'number') return false;
  if (!config || typeof config.threshold !== 'number') return false;
  if (!Array.isArray(config.columnMappings)) return false;
  if (!summary || typeof summary.totalCandidates !== 'number') return false;
  if (!Array.isArray(data.candidates)) return false;

  return data.candidates.every((candidate) => {
    if (!candidate || typeof candidate !== 'object') return false;
    const entry = candidate as Record<string, unknown>;
    return (
      typeof entry.recordAId === 'number' &&
      typeof entry.recordBId === 'number' &&
      typeof entry.overallScore === 'number' &&
      Array.isArray(entry.fieldScores)
    );
  });
}
