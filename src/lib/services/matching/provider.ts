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
