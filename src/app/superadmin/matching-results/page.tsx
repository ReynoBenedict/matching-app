'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockMatchingResults,
  mockResultStatistics,
} from '@/lib/mock/phase6';

interface ResultStat {
  label: string;
  value: number;
  change?: number;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'error';
}

export default function MatchingResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState(mockMatchingResults);
  const [stats, setStats] = useState(mockResultStatistics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const statsCards: ResultStat[] = [
    {
      label: 'Total Proses Matching',
      value: stats.totalResults,
      icon: 'checklist',
      color: 'primary',
    },
    {
      label: 'Rekaman Cocok',
      value: stats.totalMatched,
      change: 15,
      icon: 'check_circle',
      color: 'success',
    },
    {
      label: 'Rekaman Tidak Cocok',
      value: stats.totalNonMatched,
      icon: 'cancel',
      color: 'warning',
    },
    {
      label: 'Belum Ditentukan',
      value: stats.totalUnsure,
      icon: 'help',
      color: 'error',
    },
  ];

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResults(mockMatchingResults);
      setStats(mockResultStatistics);
    }, 800);
  };

  const handleSimulateError = () => {
    setError('Gagal memuat data hasil matching. Silakan coba lagi.');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <div className="space-y-lg">
        <div className="flex flex-col gap-base">
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Hasil Matching</h1>
          <p className="text-on-surface-variant font-body-md text-body-md">
            Ringkasan hasil pencocokan data dan proses matching yang telah diselesaikan.
          </p>
        </div>

        <div className="bg-error-container border-l-4 border-error p-lg rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-error">error</span>
              <div>
                <h3 className="font-label-lg text-label-lg text-error font-semibold">Error</h3>
                <p className="text-error font-body-md">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="px-md py-sm bg-error text-on-error font-label-md rounded-lg hover:opacity-90 transition-opacity"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-3xl gap-md">
        <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>
          progress_activity
        </span>
        <p className="text-on-surface-variant font-body-lg">Memuat data hasil matching...</p>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Page Header */}
      <div className="flex flex-col gap-base">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Hasil Matching</h1>
        <p className="text-on-surface-variant font-body-md text-body-md">
          Ringkasan hasil pencocokan data dan proses matching yang telah diselesaikan.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-surface-container-low rounded-lg border border-outline p-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-on-surface-variant font-label-md text-label-md">{stat.label}</p>
                <div className="flex items-baseline gap-sm mt-xs">
                  <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                    {stat.value.toLocaleString('id-ID')}
                  </span>
                  {stat.change && (
                    <span className={`font-label-md text-label-md ${stat.change >= 0 ? 'text-success' : 'text-error'}`}>
                      {stat.change >= 0 ? '+' : ''}
                      {stat.change}%
                    </span>
                  )}
                </div>
              </div>
              <span className={`material-symbols-outlined text-${stat.color}`}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      <div className="bg-surface rounded-lg border border-outline p-lg">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Ringkasan Hasil Matching</h2>
          <div className="text-on-surface-variant font-body-md">
            Rasio Cocok Keseluruhan: <span className="font-bold text-primary">{stats.overallMatchRate}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-success" style={{ fontSize: '20px' }}>
                check_circle
              </span>
              <span className="text-on-surface-variant font-label-md">Telah Diselesaikan</span>
            </div>
            <div className="font-headline-md text-headline-md font-bold text-on-surface">
              {mockResultStatistics.verifiedCount} Proses
            </div>
          </div>

          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-warning" style={{ fontSize: '20px' }}>
                pending
              </span>
              <span className="text-on-surface-variant font-label-md">Dalam Proses</span>
            </div>
            <div className="font-headline-md text-headline-md font-bold text-on-surface">
              {mockResultStatistics.inProgressCount} Proses
            </div>
          </div>

          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-outline" style={{ fontSize: '20px' }}>
                schedule
              </span>
              <span className="text-on-surface-variant font-label-md">Menunggu</span>
            </div>
            <div className="font-headline-md text-headline-md font-bold text-on-surface">
              {mockResultStatistics.pendingCount} Proses
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-surface rounded-lg border border-outline overflow-hidden">
        <div className="p-lg border-b border-outline">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Daftar Hasil Matching</h2>
            <div className="text-on-surface-variant font-body-md">Total {results.length} proses</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-low border-b border-outline">
              <tr>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">ID Proses</th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Dataset A</th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Dataset B</th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Threshold</th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Status</th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Cocok</th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Tgl Selesai</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr
                  key={result.id}
                  className="border-b border-outline-variant hover:bg-surface-container-low cursor-pointer"
                  onClick={() => router.push(`/superadmin/matching-results/${result.id}`)}
                >
                  <td className="p-md">
                    <div className="font-label-md text-label-md text-primary">{result.id}</div>
                  </td>
                  <td className="p-md">
                    <div className="font-body-md text-body-md text-on-surface truncate">{result.datasetA}</div>
                  </td>
                  <td className="p-md">
                    <div className="font-body-md text-body-md text-on-surface truncate">{result.datasetB}</div>
                  </td>
                  <td className="p-md">
                    <span className="px-sm py-xs bg-primary-container text-on-primary-container font-label-md rounded-lg">
                      {result.threshold.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-md">
                    <span
                      className={`inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md ${
                        result.completedAt
                          ? 'bg-success-container text-on-success-container'
                          : 'bg-warning-container text-on-warning-container'
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        {result.completedAt ? 'check_circle' : 'pending'}
                      </span>
                      {result.completedAt ? 'Selesai' : 'Berjalan'}
                    </span>
                  </td>
                  <td className="p-md">
                    <div className="flex flex-col gap-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant font-label-md">Cocok:</span>
                        <span className="font-label-md text-label-md text-success font-semibold">
                          {result.matchCount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant font-label-md">Tidak Cocok:</span>
                        <span className="font-label-md text-label-md text-warning font-semibold">
                          {result.nonMatchCount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-md">
                    <div className="text-on-surface-variant font-body-md">{formatDate(result.completedAt)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {results.length === 0 && (
          <div className="py-3xl text-center">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '48px' }}>
              dataset
            </span>
            <p className="text-on-surface-variant font-body-lg mt-md">Belum ada hasil matching</p>
            <p className="text-on-surface-variant font-body-md mt-sm">
              Proses pencocokan pertama akan muncul di sini
            </p>
          </div>
        )}

        <div className="p-lg border-t border-outline bg-surface-container-low">
          <div className="flex items-center justify-between">
            <div className="text-on-surface-variant font-body-md">Menampilkan {results.length} dari {results.length} proses</div>
            <div className="flex gap-sm">
              <button className="px-md py-sm border border-outline rounded-lg text-on-surface font-label-md hover:bg-surface-container">
                <span className="material-symbols-outlined align-middle mr-xs" style={{ fontSize: '20px' }}>
                  file_download
                </span>
                Ekspor CSV
              </button>
              <button
                onClick={handleRetry}
                className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined align-middle mr-xs" style={{ fontSize: '20px' }}>
                  refresh
                </span>
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-surface-container rounded-lg border border-outline p-lg">
        <div className="flex items-start gap-md">
          <span className="material-symbols-outlined text-primary">info</span>
          <div>
            <h3 className="font-label-lg text-label-lg text-on-surface font-semibold mb-sm">
              Tentang Halaman Hasil Matching
            </h3>
            <p className="text-on-surface-variant font-body-md mb-sm">
              Halaman ini menampilkan hasil akhir dari proses pencocokan data yang telah dilakukan. Setiap entri
              mencakup informasi tentang dataset yang dicocokkan, threshold yang digunakan, jumlah rekaman yang
              cocok/tidak cocok, serta tanggal penyelesaian.
            </p>
            <p className="text-on-surface-variant font-body-md">
              Data ditampilkan menggunakan mock data Phase 6 dan akan dihubungkan ke API sebenarnya setelah backend
              Phase 6 tersedia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
