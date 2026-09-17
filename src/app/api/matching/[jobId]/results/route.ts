import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { requireAuth } from '@/lib/auth/authorization';
import { getDatabase } from '@/lib/db';
import { matchingRuns } from '@/lib/db/schema';
import { getMatchingJob } from '@/lib/services/matching';
import { getMatchingCandidatesByRun } from '@/lib/services/matching-results';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireAuth();
    const { jobId } = await params;

    let matchingRunId: number | null = null;

    /*
     * CASE 1
     * Job masih ada di in-memory registry.
     */
    const job = getMatchingJob(jobId);

    if (job) {
      if (job.createdBy !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden.',
          },
          { status: 403 }
        );
      }

      if (job.state !== 'COMPLETED' || !job.matchingRunId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Hasil matching belum tersedia.',
          },
          { status: 409 }
        );
      }

      matchingRunId = job.matchingRunId;
    } else {
      /*
       * CASE 2
       * Job UUID sudah tidak ada, tetapi caller memberikan
       * persisted matching_runs.id.
       *
       * Contoh:
       * /api/matching/40/results
       */
      const persistedRunId = Number(jobId);

      if (!Number.isInteger(persistedRunId) || persistedRunId <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Job atau matching run tidak ditemukan.',
          },
          { status: 404 }
        );
      }

      const db = getDatabase();

      const [run] = await db
        .select({
          id: matchingRuns.id,
          createdBy: matchingRuns.createdBy,
          status: matchingRuns.status,
        })
        .from(matchingRuns)
        .where(eq(matchingRuns.id, persistedRunId))
        .limit(1);

      if (!run) {
        return NextResponse.json(
          {
            success: false,
            error: 'Matching run tidak ditemukan.',
          },
          { status: 404 }
        );
      }

      if (run.createdBy !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden.',
          },
          { status: 403 }
        );
      }

      if (run.status !== 'COMPLETED') {
        return NextResponse.json(
          {
            success: false,
            error: 'Hasil matching belum selesai.',
          },
          { status: 409 }
        );
      }

      matchingRunId = run.id;
    }

    if (!matchingRunId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Matching run tidak tersedia.',
        },
        { status: 409 }
      );
    }

    /*
     * Server-side pagination.
     */
    const rawPage = Number(
      request.nextUrl.searchParams.get('page') || '1'
    );

    const rawLimit = Number(
      request.nextUrl.searchParams.get('limit') || '20'
    );

    const page = Number.isFinite(rawPage)
      ? Math.max(1, Math.floor(rawPage))
      : 1;

    const limit = Number.isFinite(rawLimit)
      ? Math.min(100, Math.max(1, Math.floor(rawLimit)))
      : 20;

    const result = await getMatchingCandidatesByRun(
      matchingRunId,
      page,
      limit
    );

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Matching results error:', error);

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('unauthorized')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memuat hasil matching.',
      },
      { status: 500 }
    );
  }
}