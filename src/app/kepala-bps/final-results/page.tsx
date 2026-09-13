'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockMatchingResults } from '@/lib/mock/phase6';
import type { MatchingResult } from '@/types/phase6';

export default function FinalResultsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<MatchingResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call with 500ms loading timeout
    const loadTimer = setTimeout(() => {
      try {
        setResults(mockMatchingResults);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        setError('Gagal memuat hasil akhir. Silakan coba lagi.');
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(loadTimer);
  }, []);

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
          <p className="mt-4 text-on-surface-variant">Memuat hasil akhir...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalProcesses = results.length;
  const completedCount = results.filter(r => r.completedAt).length;
  const inProgressCount = results.filter(r => !r.completedAt).length;
  const failedCount = 0; // Based on mock data, no failed processes

  // Helper function to get status badge styles
  const getStatusBadgeStyles = (completed: boolean) => {
    if (completed) {
      return 'bg-success/20 text-success';
    }
    return 'bg-warning/20 text-warning';
  };

  // Helper function to get status text
  const getStatusText = (completed: boolean) => {
    return completed ? 'SELESAI' : 'BERLANGSUNG';
  };

  // Helper function to get status icon
  const getStatusIcon = (completed: boolean) => {
    return completed ? 'check_circle' : 'schedule';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-on-surface">Hasil Akhir Pencocokan</h1>
          <p className="mt-2 text-on-surface-variant">Daftar lengkap hasil proses pencocokan data</p>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg border border-error bg-error/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="text-on-surface">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-on-primary hover:bg-error/90 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Summary cards grid */}
        {!error && (
          <>
            <div className="grid gap-4 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Processes */}
              <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-on-surface-variant">Total Proses</p>
                    <p className="mt-2 text-2xl font-bold text-on-surface">
                      {totalProcesses}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">hasil pencocokan</p>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-secondary">
                    assessment
                  </span>
                </div>
              </div>

              {/* Completed */}
              <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-on-surface-variant">Selesai</p>
                    <p className="mt-2 text-2xl font-bold text-on-surface">
                      {completedCount}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {totalProcesses > 0 ? Math.round((completedCount / totalProcesses) * 100) : 0}% selesai
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-success">
                    check_circle
                  </span>
                </div>
              </div>

              {/* In Progress */}
              <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-on-surface-variant">Berlangsung</p>
                    <p className="mt-2 text-2xl font-bold text-on-surface">
                      {inProgressCount}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">dalam proses</p>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-warning">
                    schedule
                  </span>
                </div>
              </div>

              {/* Failed */}
              <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-on-surface-variant">Gagal</p>
                    <p className="mt-2 text-2xl font-bold text-on-surface">
                      {failedCount}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">proses gagal</p>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-error">
                    error
                  </span>
                </div>
              </div>
            </div>

            {/* Empty state */}
            {results.length === 0 ? (
              <div className="rounded-lg border border-outline bg-surface-container p-12 text-center">
                <span className="material-symbols-outlined text-5xl inline-block text-on-surface-variant mb-4">
                  inbox
                </span>
                <p className="text-lg font-semibold text-on-surface">Tidak ada hasil matching</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Hasil pencocokan akan muncul di sini setelah proses selesai
                </p>
              </div>
            ) : (
              /* Results table */
              <div className="rounded-lg border border-outline bg-surface-container shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline bg-surface-dim">
                        <th className="px-6 py-4 text-left font-semibold text-on-surface">
                          ID Proses
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-on-surface">
                          Dataset A
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-on-surface">
                          Dataset B
                        </th>
                        <th className="px-6 py-4 text-right font-semibold text-on-surface">
                          Match Rate
                        </th>
                        <th className="px-6 py-4 text-center font-semibold text-on-surface">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-on-surface">
                          Tanggal Selesai
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result: MatchingResult) => {
                        const isCompleted = !!result.completedAt;
                        const completionDate = isCompleted
                          ? new Date(result.completedAt!).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : '-';

                        return (
                          <tr
                            key={result.id}
                            onClick={() => router.push(`/kepala-bps/final-results/${result.id}`)}
                            className="border-b border-outline hover:bg-surface-dim transition-colors cursor-pointer last:border-b-0"
                          >
                            <td className="px-6 py-4 text-on-surface font-medium">
                              {result.id}
                            </td>
                            <td className="px-6 py-4 text-on-surface">
                              {result.datasetA}
                            </td>
                            <td className="px-6 py-4 text-on-surface">
                              {result.datasetB}
                            </td>
                            <td className="px-6 py-4 text-right text-on-surface font-medium">
                              {result.matchRate.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className={`material-symbols-outlined text-base ${getStatusBadgeStyles(isCompleted)}`}>
                                  {getStatusIcon(isCompleted)}
                                </span>
                                <span
                                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeStyles(
                                    isCompleted
                                  )}`}
                                >
                                  {getStatusText(isCompleted)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-on-surface">
                              {completionDate}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
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
