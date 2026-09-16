/**
 * Matching Job Registry
 *
 * Decouples a matching run from the HTTP request that starts it.
 *
 * WHY THIS EXISTS
 * Matching used to execute inside `POST /api/matching`, so the whole run had to
 * finish inside a single request/response. Node's HTTP server aborts a request
 * after its default `requestTimeout` (300s), which is why large datasets failed
 * at roughly the 5-minute mark. Here the POST only creates a job and returns its
 * id; the provider runs detached and the UI polls for status, so a run can take
 * as long as the provider needs.
 *
 * PERSISTENCE
 * Jobs live in-process (on `globalThis`, so every route module shares one
 * registry and a browser refresh can recover a running job). No new table is
 * required for the current single-container deployment
 * (`node server.js` / Docker Compose). If the app is later scaled to multiple
 * replicas or must survive a restart mid-run, this registry is the single place
 * to swap for a database-backed store — the API contract is already async.
 *
 * The registry keeps a bounded history so long-lived processes do not grow
 * without limit.
 */

import { recordAuditLog } from '@/lib/audit';
import { getMatchingProvider } from './factory';
import { persistMatchingResult } from './persistence';
import {
  isMatchingResponseData,
  type MatchingRequest,
  type MatchingResponse,
} from './provider';

export type MatchingJobState = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface MatchingJob {
  id: string;
  state: MatchingJobState;
  request: MatchingRequest;
  createdBy: number;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  result: NonNullable<MatchingResponse['data']> | null;
  error: string | null;
  matchingRunId: number | null;
}

/** Serializable view returned by the status endpoint (never leaks internals). */
export interface MatchingJobView {
  id: string;
  state: MatchingJobState;
  datasetAId: number;
  datasetBId: number;
  threshold: number;
  columnCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  elapsedMs: number;
  matchingRunId: number | null;
}

const COMPLETED_JOB_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_RETAINED_JOBS = 100;

interface MatchingJobRegistry {
  jobs: Map<string, MatchingJob>;
  runners: Map<string, Promise<void>>;
}

const globalStore = globalThis as typeof globalThis & {
  __bpsMatchingJobRegistry?: MatchingJobRegistry;
};

function registry(): MatchingJobRegistry {
  if (!globalStore.__bpsMatchingJobRegistry) {
    globalStore.__bpsMatchingJobRegistry = {
      jobs: new Map<string, MatchingJob>(),
      runners: new Map<string, Promise<void>>(),
    };
  }
  return globalStore.__bpsMatchingJobRegistry;
}

function toView(job: MatchingJob): MatchingJobView {
  const started = job.startedAt ?? job.createdAt;
  const ended = job.completedAt ?? Date.now();
  return {
    id: job.id,
    state: job.state,
    datasetAId: job.request.datasetAId,
    datasetBId: job.request.datasetBId,
    threshold: job.request.threshold,
    columnCount: job.request.columnMappings.length,
    createdAt: new Date(job.createdAt).toISOString(),
    startedAt: job.startedAt === null ? null : new Date(job.startedAt).toISOString(),
    completedAt:
      job.completedAt === null ? null : new Date(job.completedAt).toISOString(),
    elapsedMs: Math.max(0, ended - started),
    matchingRunId: job.matchingRunId,
  };
}

/** Canonical signature used to detect an identical in-flight request. */
function requestSignature(request: MatchingRequest): string {
  const mappings = [...request.columnMappings]
    .map((mapping) => `${mapping.columnA}\u0000${mapping.columnB}`)
    .sort()
    .join('\u0001');
  return [
    request.datasetAId,
    request.datasetBId,
    request.threshold,
    mappings,
  ].join('|');
}

function pruneJobs(): void {
  const { jobs } = registry();
  const cutoff = Date.now() - COMPLETED_JOB_RETENTION_MS;

  for (const [id, job] of jobs) {
    const finished =
      job.state === 'COMPLETED' || job.state === 'FAILED';
    if (finished && job.completedAt !== null && job.completedAt < cutoff) {
      jobs.delete(id);
    }
  }

  if (jobs.size > MAX_RETAINED_JOBS) {
    const finished = [...jobs.values()]
      .filter((job) => job.state === 'COMPLETED' || job.state === 'FAILED')
      .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
    for (const job of finished) {
      if (jobs.size <= MAX_RETAINED_JOBS) break;
      jobs.delete(job.id);
    }
  }
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    if (error.message.includes('Dataset size too large')) {
      return error.message;
    }
    return `Proses pencocokan gagal: ${error.message}`;
  }
  return 'Proses pencocokan gagal.';
}

async function runMatchingJob(jobId: string): Promise<void> {
  const { jobs, runners } = registry();
  const job = jobs.get(jobId);
  if (!job) return;

  job.state = 'RUNNING';
  job.startedAt = Date.now();

  try {
    const provider = getMatchingProvider();
    const response = await provider.runMatching(job.request);

    if (!response || response.success !== true) {
      throw new Error(response?.error || 'Proses pencocokan gagal');
    }

    // Never trust the provider: a malformed payload becomes a failure, not a
    // fabricated success.
    if (!isMatchingResponseData(response.data)) {
      throw new Error('Respons tidak valid dari layanan pencocokan');
    }

    job.result = response.data;
    job.matchingRunId = await persistMatchingResult(job.createdBy, job.request, response.data);
    // Candidates are persisted in PostgreSQL; do not keep the entire result
    // payload in the in-process job registry after completion.
    job.result = null;
    job.state = 'COMPLETED';
    job.completedAt = Date.now();

    await recordAuditLog({
      userId: job.createdBy,
      action: 'MATCHING_COMPLETE',
      entityType: 'matching',
      metadata: {
        jobId: job.id,
        datasetAId: job.request.datasetAId,
        datasetBId: job.request.datasetBId,
        threshold: job.request.threshold,
        totalCandidates: response.data.summary.totalCandidates,
      },
    });
  } catch (error) {
    job.result = null;
    job.state = 'FAILED';
    job.completedAt = Date.now();
    job.error = normalizeErrorMessage(error);

    await recordAuditLog({
      userId: job.createdBy,
      action: 'MATCHING_FAIL',
      entityType: 'matching',
      metadata: {
        jobId: job.id,
        datasetAId: job.request.datasetAId,
        datasetBId: job.request.datasetBId,
        threshold: job.request.threshold,
        error: job.error,
      },
    });
  } finally {
    runners.delete(jobId);
    pruneJobs();
  }
}

/**
 * Ensure exactly one runner exists for a job. Synchronous check-and-set, so
 * concurrent status polls cannot start a second run in the same process. Also
 * re-arms a job whose runner was lost (e.g. module reload) while unfinished.
 */
export function ensureMatchingJobRunner(jobId: string): void {
  const { jobs, runners } = registry();
  const job = jobs.get(jobId);
  if (!job) return;
  if (job.state !== 'PENDING' && job.state !== 'RUNNING') return;
  if (runners.has(jobId)) return;

  const promise = runMatchingJob(jobId).finally(() => {
    runners.delete(jobId);
  });
  runners.set(jobId, promise);
}

export function createMatchingJob(
  createdBy: number,
  request: MatchingRequest
): { job: MatchingJob; reused: boolean } {
  const { jobs } = registry();
  pruneJobs();

  const signature = requestSignature(request);
  for (const existing of jobs.values()) {
    if (
      existing.createdBy === createdBy &&
      (existing.state === 'PENDING' || existing.state === 'RUNNING') &&
      requestSignature(existing.request) === signature
    ) {
      ensureMatchingJobRunner(existing.id);
      return { job: existing, reused: true };
    }
  }

  const job: MatchingJob = {
    id: crypto.randomUUID(),
    state: 'PENDING',
    request,
    createdBy,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    result: null,
    error: null,
    matchingRunId: null,
  };
  jobs.set(job.id, job);
  ensureMatchingJobRunner(job.id);

  return { job, reused: false };
}

export function getMatchingJob(jobId: string): MatchingJob | null {
  const job = registry().jobs.get(jobId);
  if (!job) return null;
  // Recover a job whose process-local runner is gone but whose state is open.
  ensureMatchingJobRunner(jobId);
  return job;
}

export function getMatchingJobView(job: MatchingJob): MatchingJobView {
  return toView(job);
}
