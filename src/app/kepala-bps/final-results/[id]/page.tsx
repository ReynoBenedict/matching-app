'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockMatchingResults } from '@/lib/mock/phase6/results';
import type { MatchingResult } from '@/types/phase6';

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Simulate 500ms loading state
    const loadTimer = setTimeout(() => {
      const resultId = params.id as string;
      const foundResult = mockMatchingResults.find(r => r.id === resultId);

      if (foundResult) {
        setResult(foundResult);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(loadTimer);
  }, [params.id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <span
            className="material-symbols-outlined text-[40px] inline-block text-primary"
            style={{ animation: 'spin 2s linear infinite' }}
          >
            hourglass_empty
          </span>
          <p className="mt-4 text-on-surface-variant">Memuat detail hasil...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound || !result) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-outline bg-surface-container p-8 text-center shadow-sm">
            <span className="material-symbols-outlined text-[48px] inline-block text-error">
              search_off
            </span>
            <h1 className="mt-4 text-2xl font-bold text-on-surface">Hasil Tidak Ditemukan</h1>
            <p className="mt-2 text-on-surface-variant">
              Hasil dengan ID ini tidak dapat ditemukan dalam sistem
            </p>
            <button
              onClick={() => router.back()}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Kembali ke Hasil Akhir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalVerified = result.completedCount;
  const matchPercentage = result.totalCandidates > 0 ? (result.matchCount / result.totalCandidates) * 100 : 0;
  const nonMatchPercentage = result.totalCandidates > 0 ? (result.nonMatchCount / result.totalCandidates) * 100 : 0;
  const unsurePercentage = result.totalCandidates > 0 ? (result.unsureCount / result.totalCandidates) * 100 : 0;
  const completionPercentage = result.totalCandidates > 0 ? (result.completedCount / result.totalCandidates) * 100 : 0;

  // Format dates
  const createdDate = new Date(result.createdAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const completedDate = result.completedAt
    ? new Date(result.completedAt).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Belum selesai';

  // Get status badge
  const getStatusBadge = () => {
    if (result.completedAt) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-success/20 px-3 py-1 text-sm font-semibold text-success">
          <span className="material-symbols-outlined text-base">check_circle</span>
          Selesai
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-warning/20 px-3 py-1 text-sm font-semibold text-warning">
        <span className="material-symbols-outlined text-base">schedule</span>
        Dalam Proses
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Kembali ke Hasil Akhir
          </button>
          <h1 className="text-3xl font-bold text-on-surface">Detail Hasil Matching</h1>
          <p className="mt-2 text-on-surface-variant">
            Ringkasan lengkap dari proses pencocokan data dan statistik verifikasi
          </p>
        </div>

        {/* Detail Cards Grid */}
        <div className="mb-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Dataset A Card */}
          <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-primary">database</span>
              <p className="text-sm font-semibold text-on-surface-variant">Dataset A</p>
            </div>
            <p className="text-lg font-bold text-on-surface">{result.datasetA}</p>
            <p className="mt-2 text-xs text-on-surface-variant">Sumber data utama</p>
          </div>

          {/* Dataset B Card */}
          <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-secondary">database</span>
              <p className="text-sm font-semibold text-on-surface-variant">Dataset B</p>
            </div>
            <p className="text-lg font-bold text-on-surface">{result.datasetB}</p>
            <p className="mt-2 text-xs text-on-surface-variant">Sumber data pembanding</p>
          </div>

          {/* Process ID Card */}
          <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-tertiary">fingerprint</span>
              <p className="text-sm font-semibold text-on-surface-variant">ID Proses</p>
            </div>
            <p className="text-lg font-bold text-on-surface font-mono">{result.processId}</p>
            <p className="mt-2 text-xs text-on-surface-variant">Identifikasi unik proses</p>
          </div>

          {/* Threshold Card */}
          <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-warning">tune</span>
              <p className="text-sm font-semibold text-on-surface-variant">Ambang Batas</p>
            </div>
            <p className="text-lg font-bold text-on-surface">
              {(result.threshold * 100).toFixed(0)}%
            </p>
            <p className="mt-2 text-xs text-on-surface-variant">Threshold pencocokan</p>
          </div>

          {/* Status Card */}
          <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined">info</span>
              <p className="text-sm font-semibold text-on-surface-variant">Status</p>
            </div>
            <div className="mt-2">{getStatusBadge()}</div>
            <p className="mt-3 text-xs text-on-surface-variant">Status penyelesaian</p>
          </div>

          {/* Completion Date Card */}
          <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-success">event_available</span>
              <p className="text-sm font-semibold text-on-surface-variant">Tanggal Selesai</p>
            </div>
            <p className="text-lg font-bold text-on-surface">{completedDate}</p>
            <p className="mt-2 text-xs text-on-surface-variant">Dibuat: {createdDate}</p>
          </div>
        </div>

        {/* Summary Statistics Grid */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
          {/* Ringkasan Hasil */}
          <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-on-surface">Ringkasan Hasil</h2>
            <div className="space-y-6">
              {/* Total Candidates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-on-surface-variant">Total Kandidat</p>
                  <p className="text-xl font-bold text-primary">
                    {result.totalCandidates.toLocaleString('id-ID')}
                  </p>
                </div>
                <p className="text-xs text-on-surface-variant">Total pasangan yang diproses</p>
              </div>

              {/* Match Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-on-surface-variant">Match</p>
                    <p className="text-xs text-success">
                      {matchPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-xl font-bold text-success">
                    {result.matchCount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div
                  className="h-2 bg-outline rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--outline)' }}
                >
                  <div
                    className="h-full bg-success transition-all"
                    style={{ width: `${matchPercentage}%` }}
                  />
                </div>
              </div>

              {/* Non-Match Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-on-surface-variant">Non-Match</p>
                    <p className="text-xs text-error">
                      {nonMatchPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-xl font-bold text-error">
                    {result.nonMatchCount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div
                  className="h-2 bg-outline rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--outline)' }}
                >
                  <div
                    className="h-full bg-error transition-all"
                    style={{ width: `${nonMatchPercentage}%` }}
                  />
                </div>
              </div>

              {/* Unsure Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-on-surface-variant">Tidak Yakin</p>
                    <p className="text-xs text-warning">
                      {unsurePercentage.toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-xl font-bold text-warning">
                    {result.unsureCount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div
                  className="h-2 bg-outline rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--outline)' }}
                >
                  <div
                    className="h-full bg-warning transition-all"
                    style={{ width: `${unsurePercentage}%` }}
                  />
                </div>
              </div>

              {/* Verified Count */}
              <div className="pt-4 border-t border-outline">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-on-surface-variant">Terverifikasi</p>
                  <p className="text-xl font-bold text-on-surface">
                    {totalVerified.toLocaleString('id-ID')}
                  </p>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {((totalVerified / result.totalCandidates) * 100).toFixed(1)}% dari total
                </p>
              </div>
            </div>
          </div>

          {/* Metrik Keseluruhan */}
          <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-on-surface">Metrik Keseluruhan</h2>
            <div className="space-y-8">
              {/* Match Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-on-surface-variant">Tingkat Match</p>
                  <p className="text-2xl font-bold text-success">
                    {result.matchRate.toFixed(1)}%
                  </p>
                </div>
                <div
                  className="h-3 bg-outline rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--outline)' }}
                >
                  <div
                    className="h-full bg-success transition-all"
                    style={{ width: `${result.matchRate}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-on-surface-variant">Proporsi pencocokan berhasil</p>
              </div>

              {/* Threshold Used */}
              <div>
                <p className="text-sm font-semibold text-on-surface-variant mb-3">Ambang Batas Digunakan</p>
                <div className="rounded-lg bg-surface-dim p-4">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-on-surface">
                      {(result.threshold * 100).toFixed(0)}
                    </p>
                    <p className="text-lg text-on-surface-variant">%</p>
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant">Minimum similarity score</p>
                </div>
              </div>

              {/* Completion Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-on-surface-variant">Tingkat Penyelesaian</p>
                  <p className="text-2xl font-bold text-primary">
                    {completionPercentage.toFixed(1)}%
                  </p>
                </div>
                <div
                  className="h-3 bg-outline rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--outline)' }}
                >
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-on-surface-variant">
                  {result.completedCount.toLocaleString('id-ID')} dari{' '}
                  {result.totalCandidates.toLocaleString('id-ID')} diproses
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
