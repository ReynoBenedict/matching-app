/**
 * POST /api/matching
 * Run matching on two datasets with column mappings
 * Requires authentication
 *
 * SRS COMPLIANCE NOTE:
 * This endpoint provides a stable application-level API contract.
 * The actual matching implementation (provider) can be swapped without
 * changing this endpoint. Currently uses development fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { getMatchingProvider } from '@/lib/services/matching';
import type { MatchingRequest } from '@/lib/services/matching/provider';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    await requireAuth();

    // Parse request body
    const body = await request.json();

    // Validate request structure
    if (
      typeof body.datasetAId !== 'number' ||
      typeof body.datasetBId !== 'number' ||
      !Array.isArray(body.columnMappings) ||
      typeof body.threshold !== 'number'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format. Required: datasetAId, datasetBId, columnMappings[], threshold',
        },
        { status: 400 }
      );
    }

    const matchingRequest: MatchingRequest = {
      datasetAId: body.datasetAId,
      datasetBId: body.datasetBId,
      columnMappings: body.columnMappings,
      threshold: body.threshold,
    };

    // Get the matching provider (currently development fallback, can be swapped)
    const provider = getMatchingProvider();

    // Run matching
    const result = await provider.runMatching(matchingRequest);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Matching API error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to run matching' },
      { status: 500 }
    );
  }
}
