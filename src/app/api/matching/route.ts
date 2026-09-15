/**
 * POST /api/matching
 *
 * Starts a matching run as a background JOB and returns immediately.
 *
 * WHY: matching used to run synchronously inside this request, so any run
 * longer than the HTTP server's request timeout (~5 minutes) was aborted
 * mid-flight. Now the request only validates input, creates the job, and hands
 * back its id; the provider runs detached.
 *
 * Responses:
 * - 202 { success: true, data: { jobId, state, reused } }  → run started
 * - 400 { success: false, error }                          → invalid request
 *
 * Poll progress with `GET /api/matching/{jobId}`.
 *
 * SRS COMPLIANCE NOTE:
 * This endpoint provides a stable application-level API contract.
 * The actual matching implementation (provider) can be swapped without
 * changing this endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { createMatchingJob, getMatchingProvider } from '@/lib/services/matching';
import type { MatchingRequest } from '@/lib/services/matching/provider';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

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

    // Validate before creating a job so bad input fails fast (and synchronously)
    // instead of becoming a job that immediately fails.
    const provider = getMatchingProvider();
    const validation = await provider.validateRequest(matchingRequest);
    if (!validation.valid) {
      await recordAuditLog({
        userId: user.id,
        action: 'MATCHING_FAIL',
        entityType: 'matching',
        metadata: {
          datasetAId: body.datasetAId,
          datasetBId: body.datasetBId,
          threshold: body.threshold,
          error: validation.error ?? 'Proses pencocokan gagal',
        },
      });

      return NextResponse.json(
        { success: false, error: validation.error ?? 'Invalid matching request' },
        { status: 400 }
      );
    }

    // Record real activity for Riwayat Proses (start of the matching run)
    await recordAuditLog({
      userId: user.id,
      action: 'MATCHING_START',
      entityType: 'matching',
      metadata: {
        datasetAId: body.datasetAId,
        datasetBId: body.datasetBId,
        threshold: body.threshold,
        columnCount: matchingRequest.columnMappings.length,
      },
    });

    // Create the job and return its id immediately — the run happens detached.
    const { job, reused } = createMatchingJob(user.id, matchingRequest);

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: job.id,
          state: job.state,
          reused,
        },
      },
      { status: 202 }
    );
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
      { success: false, error: 'Failed to start matching' },
      { status: 500 }
    );
  }
}
