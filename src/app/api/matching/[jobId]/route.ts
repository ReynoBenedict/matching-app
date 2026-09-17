import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import {
  getMatchingJob,
  getMatchingJobView,
} from '@/lib/services/matching';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/matching/[jobId]
 *
 * Endpoint ini KHUSUS untuk membaca status job.
 *
 * Jangan masukkan pagination/results di sini.
 *
 * Contract:
 * PENDING/RUNNING
 *   -> 200 { success: true, job }
 *
 * COMPLETED
 *   -> 200 { success: true, job }
 *      job.matchingRunId berisi ID persisted matching_runs
 *
 * FAILED
 *   -> 200 { success: true, job, error }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireAuth();
    const { jobId } = await params;

    const job = getMatchingJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job pencocokan tidak ditemukan atau sudah tidak tersedia.',
        },
        { status: 404 }
      );
    }

    // User hanya boleh melihat job miliknya,
    // kecuali ADMIN.
    if (job.createdBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Tidak berhak melihat status pencocokan ini.',
        },
        { status: 403 }
      );
    }

    const view = getMatchingJobView(job);

    return NextResponse.json(
      {
        success: true,
        job: view,
        ...(job.state === 'FAILED' && job.error
          ? { error: job.error }
          : {}),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Matching job status error:', error);

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
        error: 'Gagal memuat status pencocokan.',
      },
      { status: 500 }
    );
  }
}