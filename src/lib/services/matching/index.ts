/**
 * Matching Service Module
 *
 * Exports the matching provider factory.
 * This allows swapping between different matching implementations
 * (development fallback, Model Service, etc.) without changing consumers.
 */

import { DevelopmentMatchingProvider } from './development-provider';
import type { IMatchingProvider } from './provider';

/**
 * Get the active matching provider
 *
 * SRS COMPLIANCE:
 * This factory allows the application to use different matching providers:
 * 1. Development Fallback (current) — Levenshtein-based, deterministic
 * 2. Model Service Provider (future) — External service-based
 *
 * The selection logic can check MODEL_SERVICE_URL environment variable
 * and route to the appropriate provider.
 */
export function getMatchingProvider(): IMatchingProvider {
  // TODO: In future phases, check MODEL_SERVICE_URL and route accordingly
  // For now, use development fallback
  return new DevelopmentMatchingProvider();
}

// Re-export types for consumers
export type { IMatchingProvider, MatchingRequest, MatchingResponse, CandidatePair, FieldScore } from './provider';
