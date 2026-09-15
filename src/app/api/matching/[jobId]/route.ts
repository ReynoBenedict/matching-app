/**
 * GET /api/matching/[jobId]
 *
 * Returns the current status of a matching job so the UI can poll it without
 * being tied to the request that started the run.
 *
 * Responses:
 * - 200 { success: true, job, data? }  → data is present only when COMPLETED
 * - 200 { success: true, job, error }  → job FAILED (message shown to the user)
 * - 404 { success: false, error }      → unknown job id
 *
 * Requires authentication; a job is visible to its owner or to an ADMIN.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { getMatchingJob, getMatchingJobView } from '@/lib/services/matching';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireAuth();
    const { jobId } = await params;

    const job = getMatchingJob(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job pencocokan tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (job.createdBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: bukan pemilik job pencocokan.' },
        { status: 403 }
      );
    }

    const view = getMatchingJobView(job);

    if (job.state === 'COMPLETED') {
      return NextResponse.json(
        { success: true, job: view, data: job.result },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (job.state === 'FAILED') {
      return NextResponse.json(
        {
          success: true,
          job: view,
          error: job.error ?? 'Proses pencocokan gagal.',
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { success: true, job: view },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Matching job status error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Gagal memuat status pencocokan.' },
      { status: 500 }
    );
  }
}
