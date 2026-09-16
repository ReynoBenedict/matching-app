'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import { DatasetSelector } from '@/components/matching/DatasetSelector';
import { ColumnMapper } from '@/components/matching/ColumnMapper';
import { ThresholdSelector } from '@/components/matching/ThresholdSelector';
import { MatchingResults } from '@/components/matching/MatchingResults';
import {
  THRESHOLD_DEFAULT,
  clampThreshold,
  thresholdToPercent,
} from '@/lib/services/matching/threshold';

export interface MatchingState {
  datasetAId: number | null;
  datasetBId: number | null;
  columnMappings: Array<{ columnA: string; columnB: string }>;
  /** Canonical normalized decimal in [0, 1]. */
  threshold: number;
  loading: boolean;
  error: string | null;
  results: any | null;
  step: 'dataset-a' | 'dataset-b' | 'column-mapping' | 'threshold' | 'results';
}

type MatchingJobState = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

interface MatchingJobView {
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
}

const JOB_STORAGE_KEY = 'bps:matchingJobId';
const POLL_INTERVAL_MS = 3000;

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours} jam ${minutes} menit ${seconds} detik`;
  if (minutes > 0) return `${minutes} menit ${seconds} detik`;
  return `${seconds} detik`;
}

export function MatchingContent() {
  const [state, setState] = useState<MatchingState>({
    datasetAId: null,
    datasetBId: null,
    columnMappings: [],
    threshold: THRESHOLD_DEFAULT,
    loading: false,
    error: null,
    results: null,
    step: 'dataset-a',
  });

  // The running/just-finished job. Polling is driven purely by `activeJobId`,
  // so it survives everything short of a full page reload (and a reload
  // recovers the job from localStorage).
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [job, setJob] = useState<MatchingJobView | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const isJobActive =
    activeJobId !== null &&
    (job === null || job.state === 'PENDING' || job.state === 'RUNNING');

  const activeJobStartedAt = useMemo(() => {
    if (!job || (job.state !== 'PENDING' && job.state !== 'RUNNING')) return null;
    return new Date(job.startedAt ?? job.createdAt).getTime();
  }, [job]);

  // Resume an unfinished job after a page refresh.
  useEffect(() => {
    const stored = localStorage.getItem(JOB_STORAGE_KEY);
    if (!stored) return;
    setState((prev) => ({ ...prev, loading: true }));
    setActiveJobId(stored);
  }, []);

  // Poll the job status. Never times out the run: it only stops when the job
  // reaches a terminal state or the user leaves. Transient network errors retry.
  useEffect(() => {
    if (!activeJobId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll(jobId: string) {
      try {
        const response = await fetch(`/api/matching/${jobId}`, {
          cache: 'no-store',
        });
        if (cancelled) return;

        // Job is gone (expired, server restarted, or not ours): stop cleanly.
        if (response.status === 404 || response.status === 403) {
          localStorage.removeItem(JOB_STORAGE_KEY);
          setActiveJobId(null);
          setJob(null);
          setState((prev) => ({
            ...prev,
            loading: false,
            error:
              response.status === 403
                ? 'Tidak berhak melihat status pencocokan ini.'
                : null,
          }));
          return;
        }

        const payload = await response.json();
        if (cancelled) return;

        if (!response.ok || !payload.success) {
          localStorage.removeItem(JOB_STORAGE_KEY);
          setActiveJobId(null);
          setJob(null);
          setState((prev) => ({
            ...prev,
            loading: false,
            error: payload.error || 'Gagal memuat status pencocokan.',
          }));
          return;
        }

        const view: MatchingJobView = payload.job;
        setJob(view);

        if (view.state === 'COMPLETED') {
          localStorage.removeItem(JOB_STORAGE_KEY);
          setActiveJobId(null);
          setState((prev) => ({
            ...prev,
            loading: false,
            error: null,
            results: payload.data,
            step: 'results',
          }));
          return;
        }

        if (view.state === 'FAILED') {
          localStorage.removeItem(JOB_STORAGE_KEY);
          setActiveJobId(null);
          setState((prev) => ({
            ...prev,
            loading: false,
            error: payload.error || 'Proses pencocokan gagal.',
          }));
          return;
        }

        // Still PENDING/RUNNING — keep polling.
        timer = setTimeout(() => poll(jobId), POLL_INTERVAL_MS);
      } catch {
        if (cancelled) return;
        // Network hiccup: keep the job alive and retry.
        timer = setTimeout(() => poll(jobId), POLL_INTERVAL_MS);
      }
    }

    poll(activeJobId);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activeJobId, refreshNonce]);

  // Live elapsed-time counter while the job runs.
  useEffect(() => {
    if (activeJobStartedAt === null) {
      setElapsedMs(0);
      return;
    }
    setElapsedMs(Date.now() - activeJobStartedAt);
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - activeJobStartedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeJobStartedAt]);

  const handleSelectDatasetA = (datasetId: number) => {
    setState((prev) => ({
      ...prev,
      datasetAId: datasetId,
      step: 'dataset-b',
      columnMappings: [],
      error: null,
    }));
  };

  const handleSelectDatasetB = (datasetId: number) => {
    setState((prev) => ({
      ...prev,
      datasetBId: datasetId,
      step: 'column-mapping',
      error: null,
    }));
  };

  const handleUpdateMappings = (
    mappings: Array<{ columnA: string; columnB: string }>
  ) => {
    setState((prev) => ({
      ...prev,
      columnMappings: mappings,
    }));
  };

  const handleProceedToThreshold = () => {
    if (state.columnMappings.length === 0) {
      setState((prev) => ({
        ...prev,
        error: 'At least one column mapping is required',
      }));
      return;
    }
    setState((prev) => ({
      ...prev,
      step: 'threshold',
      error: null,
    }));
  };

  const handleThresholdChange = (threshold: number) => {
    setState((prev) => ({
      ...prev,
      threshold: clampThreshold(threshold),
    }));
  };

  const handleRunMatching = async () => {
    // Prevent duplicate jobs from repeated clicks or an already-running job.
    if (isJobActive) return;

    if (!state.datasetAId || !state.datasetBId || state.columnMappings.length === 0) {
      setState((prev) => ({
        ...prev,
        error: 'Missing configuration for matching',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetAId: state.datasetAId,
          datasetBId: state.datasetBId,
          columnMappings: state.columnMappings,
          threshold: clampThreshold(state.threshold),
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: payload.error || 'Failed to run matching',
        }));
        return;
      }

      const jobId: string | undefined = payload.data?.jobId;
      if (!jobId) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Respons tidak valid dari server (jobId tidak ditemukan).',
        }));
        return;
      }

      // Remember the job so a refresh can recover it, then start polling.
      localStorage.setItem(JOB_STORAGE_KEY, jobId);
      setJob({
        id: jobId,
        state: payload.data?.state ?? 'PENDING',
        datasetAId: state.datasetAId!,
        datasetBId: state.datasetBId!,
        threshold: clampThreshold(state.threshold),
        columnCount: state.columnMappings.length,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        elapsedMs: 0,
      });
      setActiveJobId(jobId);
      setState((prev) => ({ ...prev, loading: true, error: null }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          'Failed to run matching: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      }));
    }
  };

  const handleRefreshStatus = useCallback(() => {
    setRefreshNonce((value) => value + 1);
  }, []);

  const handleReset = () => {
    localStorage.removeItem(JOB_STORAGE_KEY);
    setActiveJobId(null);
    setJob(null);
    setState({
      datasetAId: null,
      datasetBId: null,
      columnMappings: [],
      threshold: THRESHOLD_DEFAULT,
      loading: false,
      error: null,
      results: null,
      step: 'dataset-a',
    });
  };

  const statusLabel =
    job?.state === 'PENDING' ? 'Menunggu diproses...' : 'Sedang diproses...';

  return (
    <SuperadminLayout pageTitle="Pencocokan Data">
      <div className="space-y-6">
        {/* Error message */}
        {state.error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-lg border border-error">
            <p className="font-semibold">Kesalahan:</p>
            <p className="text-sm mt-1">{state.error}</p>
          </div>
        )}

        {/* Step 1: Select Dataset A */}
        {state.step === 'dataset-a' && (
          <DatasetSelector
            title="Langkah 1: Pilih Dataset Pertama"
            selectedId={state.datasetAId}
            onSelect={handleSelectDatasetA}
            loading={state.loading}
          />
        )}

        {/* Step 2: Select Dataset B */}
        {state.step === 'dataset-b' && (
          <>
            <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
              <p className="text-sm font-semibold text-on-surface">Dataset Pertama</p>
              <p className="text-sm text-on-surface-variant mt-1">ID: {state.datasetAId}</p>
            </div>
            <DatasetSelector
              title="Langkah 2: Pilih Dataset Kedua"
              selectedId={state.datasetBId}
              excludeId={state.datasetAId}
              onSelect={handleSelectDatasetB}
              loading={state.loading}
            />
          </>
        )}

        {/* Step 3: Column Mapping */}
        {state.step === 'column-mapping' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                <p className="text-sm font-semibold text-on-surface">Dataset Pertama</p>
                <p className="text-sm text-on-surface-variant mt-1">ID: {state.datasetAId}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                <p className="text-sm font-semibold text-on-surface">Dataset Kedua</p>
                <p className="text-sm text-on-surface-variant mt-1">ID: {state.datasetBId}</p>
              </div>
            </div>
            <ColumnMapper
              datasetAId={state.datasetAId!}
              datasetBId={state.datasetBId!}
              mappings={state.columnMappings}
              onUpdateMappings={handleUpdateMappings}
            />
            <button
              onClick={handleProceedToThreshold}
              disabled={state.columnMappings.length === 0 || state.loading}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Lanjut ke Konfigurasi Threshold
            </button>
          </>
        )}

        {/* Step 4: Threshold */}
        {state.step === 'threshold' && (
          <>
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-4">Konfigurasi Pencocokan</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-2">Kolom yang dipetakan:</p>
                  <ul className="space-y-1">
                    {state.columnMappings.map((mapping, idx) => (
                      <li key={idx} className="text-sm text-on-surface-variant">
                        {mapping.columnA} ↔ {mapping.columnB}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <ThresholdSelector
              threshold={state.threshold}
              onThresholdChange={handleThresholdChange}
            />

            {isJobActive ? (
              <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant space-y-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  <div>
                    <p className="font-semibold text-on-surface">
                      Pencocokan sedang berjalan
                    </p>
                    <p className="text-sm text-on-surface-variant">{statusLabel}</p>
                  </div>
                </div>

                <div className="text-sm text-on-surface-variant space-y-1">
                  <p>
                    Dataset #{job?.datasetAId ?? state.datasetAId} ↔ #
                    {job?.datasetBId ?? state.datasetBId} · Threshold{' '}
                    {thresholdToPercent(job?.threshold ?? state.threshold)}%
                  </p>
                  <p>
                    Waktu berjalan:{' '}
                    <span className="font-semibold text-on-surface">
                      {formatDuration(elapsedMs)}
                    </span>
                  </p>
                </div>

                <p className="text-xs text-on-surface-variant">
                  Anda dapat meninggalkan halaman ini. Proses berjalan di server dan
                  statusnya akan dipulihkan saat halaman dibuka kembali.
                </p>

                <button
                  onClick={handleRefreshStatus}
                  className="w-full bg-surface border border-outline-variant text-primary py-3 rounded-lg font-label-md hover:bg-surface-container transition-colors"
                >
                  Perbarui Status
                </button>
              </div>
            ) : (
              <button
                onClick={handleRunMatching}
                disabled={state.loading}
                className="w-full bg-secondary text-on-secondary py-3 rounded-lg font-label-md hover:bg-secondary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {state.loading ? 'Memproses...' : 'Jalankan Pencocokan'}
              </button>
            )}
          </>
        )}

        {/* Step 5: Results */}
        {state.step === 'results' && state.results && (
          <>
            <MatchingResults results={state.results} />
            <button
              onClick={handleReset}
              className="w-full bg-tertiary text-on-tertiary py-3 rounded-lg font-label-md hover:bg-tertiary-container transition-colors"
            >
              Mulai Pencocokan Baru
            </button>
          </>
        )}
      </div>
    </SuperadminLayout>
  );
}
