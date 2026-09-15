/**
 * Matching Provider factory
 *
 * Selects the active matching provider without changing any consumer.
 *
 * Default: the development fallback (Levenshtein). The external Model Service
 * provider is opt-in via `MATCHING_PROVIDER=model_service`, so setting
 * `MODEL_SERVICE_URL` alone never reroutes matching (the URL is present in
 * existing environments but the service is not yet implemented).
 */

import { DevelopmentMatchingProvider } from './development-provider';
import { ModelServiceMatchingProvider } from './model-service-provider';
import type { IMatchingProvider } from './provider';

export type MatchingProviderKind = 'development' | 'model_service';

export function getMatchingProviderKind(): MatchingProviderKind {
  const configured = (process.env.MATCHING_PROVIDER ?? '').trim().toLowerCase();
  if (
    configured === 'model_service' ||
    configured === 'model-service' ||
    configured === 'model'
  ) {
    return 'model_service';
  }
  return 'development';
}

export function getMatchingProvider(): IMatchingProvider {
  if (getMatchingProviderKind() === 'model_service') {
    return new ModelServiceMatchingProvider();
  }
  return new DevelopmentMatchingProvider();
}
