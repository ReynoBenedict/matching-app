/**
 * Development Fallback Matching Provider
 *
 * IMPORTANT: This is a TEMPORARY DEVELOPMENT FALLBACK implementation.
 *
 * SRS COMPLIANCE NOTE:
 * According to the system architecture, the actual matching algorithm should be
 * provided by the Model Service (external service running on port 8000).
 * This development fallback exists ONLY because the Model Service has not been
 * implemented yet (see docker-compose.yml comments).
 *
 * THIS IMPLEMENTATION IS NOT INTENDED TO BE THE PRODUCTION MATCHING ALGORITHM.
 *
 * Production Matching:
 * - Will be provided by the external Model Service
 * - Will be integrated via MODEL_SERVICE_URL environment variable
 * - Will replace this development implementation seamlessly
 *
 * Development Fallback Algorithm:
 * - Uses deterministic Levenshtein distance (NOT ML, NOT AI)
 * - Used for testing and development ONLY
 * - Produces consistent, reproducible results for testing
 * - Will be removed when Model Service is integrated
 *
 * DO NOT:
 * - Use this in production before Model Service integration
 * - Describe this as the official matching algorithm
 * - Build additional features that depend on Levenshtein implementation details
 */

import { getDatabase } from '@/lib/db';
import { datasets, datasetColumns, datasetRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type {
  IMatchingProvider,
  MatchingRequest,
  MatchingResponse,
  FieldScore,
  CandidatePair,
} from './provider';

/**
 * Development fallback provider using Levenshtein distance
 * This is temporary and will be replaced by the Model Service
 */
export class DevelopmentMatchingProvider implements IMatchingProvider {
  async validateRequest(
    req: MatchingRequest
  ): Promise<{ valid: boolean; error?: string }> {
    // Validate dataset IDs are integers
    if (!Number.isInteger(req.datasetAId) || !Number.isInteger(req.datasetBId)) {
      return { valid: false, error: 'Dataset IDs must be integers' };
    }

    // Datasets must not be the same
    if (req.datasetAId === req.datasetBId) {
      return { valid: false, error: 'Dataset A and Dataset B must be different' };
    }

    // At least one mapping required
    if (!req.columnMappings || req.columnMappings.length === 0) {
      return { valid: false, error: 'At least one column mapping is required' };
    }

    // Validate threshold
    if (typeof req.threshold !== 'number' || req.threshold < 0 || req.threshold > 1) {
      return { valid: false, error: 'Threshold must be a number between 0 and 1' };
    }

    const db = getDatabase();

    // Verify both datasets exist
    const [datasetA] = await db
      .select({ id: datasets.id, status: datasets.status })
      .from(datasets)
      .where(eq(datasets.id, req.datasetAId));

    if (!datasetA) {
      return { valid: false, error: 'Dataset A not found' };
    }

    if (datasetA.status !== 'READY') {
      return { valid: false, error: 'Dataset A must have READY status' };
    }

    const [datasetB] = await db
      .select({ id: datasets.id, status: datasets.status })
      .from(datasets)
      .where(eq(datasets.id, req.datasetBId));

    if (!datasetB) {
      return { valid: false, error: 'Dataset B not found' };
    }

    if (datasetB.status !== 'READY') {
      return { valid: false, error: 'Dataset B must have READY status' };
    }

    // Validate each column mapping
    for (const mapping of req.columnMappings) {
      if (!mapping.columnA || !mapping.columnB) {
        return {
          valid: false,
          error: 'Column mappings must have both columnA and columnB',
        };
      }

      // Verify columnA exists in datasetA
      const [colA] = await db
        .select({ id: datasetColumns.id })
        .from(datasetColumns)
        .where(eq(datasetColumns.datasetId, req.datasetAId));

      if (!colA) {
        return { valid: false, error: `Column "${mapping.columnA}" not found in Dataset A` };
      }

      // Verify columnB exists in datasetB
      const [colB] = await db
        .select({ id: datasetColumns.id })
        .from(datasetColumns)
        .where(eq(datasetColumns.datasetId, req.datasetBId));

      if (!colB) {
        return { valid: false, error: `Column "${mapping.columnB}" not found in Dataset B` };
      }
    }

    return { valid: true };
  }

  async runMatching(req: MatchingRequest): Promise<MatchingResponse> {
    const db = getDatabase();

    try {
      // Validate request
      const validation = await this.validateRequest(req);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Fetch dataset metadata
      const [datasetA] = await db
        .select({ id: datasets.id, name: datasets.name })
        .from(datasets)
        .where(eq(datasets.id, req.datasetAId));

      const [datasetB] = await db
        .select({ id: datasets.id, name: datasets.name })
        .from(datasets)
        .where(eq(datasets.id, req.datasetBId));

      if (!datasetA || !datasetB) {
        return {
          success: false,
          error: 'Failed to retrieve dataset metadata',
        };
      }

      // Fetch all records from both datasets
      const recordsA = await db
        .select()
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, req.datasetAId));

      const recordsB = await db
        .select()
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, req.datasetBId));

      // Performance safety check
      const totalComparisons = recordsA.length * recordsB.length;
      const MAX_COMPARISONS = 1000000; // 1M comparisons max
      if (totalComparisons > MAX_COMPARISONS) {
        return {
          success: false,
          error: `Dataset size too large for development fallback. Would require ${totalComparisons} comparisons (max: ${MAX_COMPARISONS})`,
        };
      }

      const candidates: CandidatePair[] = [];

      // Compare each record in A against each record in B
      for (const recordA of recordsA) {
        for (const recordB of recordsB) {
          const fieldScores: FieldScore[] = [];
          let totalScore = 0;

          // Calculate similarity for each mapped column
          for (const mapping of req.columnMappings) {
            const valueA = (recordA as Record<string, unknown>)[toCamelCase(mapping.columnA)];
            const valueB = (recordB as Record<string, unknown>)[toCamelCase(mapping.columnB)];

            const fieldSimilarity = calculateSimilarity(valueA, valueB);
            fieldScores.push({
              columnA: mapping.columnA,
              columnB: mapping.columnB,
              score: parseFloat(fieldSimilarity.toFixed(4)),
            });

            totalScore += fieldSimilarity;
          }

          // Calculate overall score as average of field scores
          const overallScore = fieldScores.length > 0 ? totalScore / fieldScores.length : 0;

          // Only include if meets threshold
          if (overallScore >= req.threshold) {
            candidates.push({
              recordAId: recordA.id,
              recordBId: recordB.id,
              idsbrA: recordA.idsbr,
              idsbrB: recordB.idsbr,
              fieldScores,
              overallScore: parseFloat(overallScore.toFixed(4)),
            });
          }
        }
      }

      // Sort by overallScore descending
      candidates.sort((a, b) => b.overallScore - a.overallScore);

      return {
        success: true,
        data: {
          datasetA: { id: datasetA.id, name: datasetA.name },
          datasetB: { id: datasetB.id, name: datasetB.name },
          config: {
            columnMappings: req.columnMappings,
            threshold: req.threshold,
          },
          summary: {
            totalCandidates: candidates.length,
          },
          candidates,
        },
      };
    } catch (error) {
      console.error('Development fallback matching error:', error);
      return {
        success: false,
        error: 'Failed to run matching (development fallback)',
      };
    }
  }
}

/**
 * Normalize text for comparison
 */
function normalizeText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Normalize repeated whitespace
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate normalized Levenshtein similarity (0.0 to 1.0)
 */
function calculateSimilarity(valueA: unknown, valueB: unknown): number {
  const normA = normalizeText(valueA);
  const normB = normalizeText(valueB);

  // If both are empty, treat as non-match (0.0)
  if (normA === '' && normB === '') {
    return 0.0;
  }

  // If one is empty and other is not, they don't match
  if (normA === '' || normB === '') {
    return 0.0;
  }

  const distance = levenshteinDistance(normA, normB);
  const maxLength = Math.max(normA.length, normB.length);

  return 1.0 - distance / maxLength;
}

/**
 * Helper: convert snake_case to camelCase for database field access
 */
function toCamelCase(str: string): string {
  return str
    .split('_')
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}
