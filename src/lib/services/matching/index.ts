/**
 * Matching Service Module
 *
 * Public entry point for the matching subsystem:
 * - `getMatchingProvider()` selects the active provider (development fallback
 *   or the opt-in Model Service adapter) without changing consumers.
 * - The job API lets an HTTP request start a long-running matching run and
 *   return immediately, with status recovered later.
 */

export {
  getMatchingProvider,
  getMatchingProviderKind,
  type MatchingProviderKind,
} from './factory';

export {
  createMatchingJob,
  ensureMatchingJobRunner,
  getMatchingJob,
  getMatchingJobView,
  type MatchingJob,
  type MatchingJobState,
  type MatchingJobView,
} from './jobs';

// Re-export types for consumers
export {
  isMatchingResponseData,
  type IMatchingProvider,
  type MatchingRequest,
  type MatchingResponse,
  type CandidatePair,
  type FieldScore,
  type ColumnMapping,
} from './provider';
