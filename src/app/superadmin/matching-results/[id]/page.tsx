'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { MatchingResult, ResultDetail } from '@/types/phase6';
import { mockMatchingResults, mockResultDetails } from '@/lib/mock/phase6';

export default function ResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [result, setResult] = useState<MatchingResult | null>(null);
  const [details, setDetails] = useState<ResultDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'status' | 'score'>('status');

  // Simulate fetching result data
  useEffect(() => {
    const timer = setTimeout(() => {
      const foundResult = mockMatchingResults.find(r => r.id === resultId);
      if (foundResult) {
        setResult(foundResult);
        setDetails(mockResultDetails);
        setLoading(false);
      } else {
        setError('Hasil matching tidak ditemukan');
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [resultId]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-success-container text-on-success-container';
      case 'IN_PROGRESS':
        return 'bg-warning-container text-on-warning-container';
      case 'PENDING':
        return 'bg-outline-container text-on-surface-variant';
      default:
        return 'bg-surface-container text-on-surface';
    }
  };

  const getVerificationColor = (result?: string) => {
    switch (result) {
      case 'MATCH':
        return 'bg-success-container text-on-success-container';
      case 'NON_MATCH':
        return 'bg-warning-container text-on-warning-container';
      case 'UNSURE':
        return 'bg-outline-container text-on-surface-variant';
      default:
        return 'bg-surface-container text-on-surface';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Selesai';
      case 'IN_PROGRESS':
        return 'Dalam Proses';
      case 'PENDING':
        return 'Menunggu';
      default:
        return status;
    }
  };

  const sortedDetails = [...details].sort((a, b) => {
    if (sortBy === 'status') {
      const statusOrder = { COMPLETED: 0, IN_PROGRESS: 1, PENDING: 2 };
      return (statusOrder[a.status as keyof typeof statusOrder] || 3) - 
             (statusOrder[b.status as keyof typeof statusOrder] || 3);
    } else {
      return (b.overallScore || 0) - (a.overallScore || 0);
    }
  });

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-3xl gap-md">
        <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>
          progress_activity
        </span>
        <p className="text-on-surface-variant font-body-lg">Memuat detail hasil matching...</p>
      </div>
    );
  }

  // Error State - 404 or Not Found
  if (error || !result) {
    return (
      <div className="space-y-lg">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-sm text-primary font-label-md hover:opacity-80 transition-opacity mb-lg"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Kembali
        </button>

        <div className="bg-error-container border-l-4 border-error p-lg rounded-lg">
          <div className="flex items-start gap-md">
            <span className="material-symbols-outlined text-error flex-shrink-0">error</span>
            <div>
              <h3 className="font-label-lg text-label-lg text-error font-semibold">
                {error || 'Hasil matching tidak ditemukan'}
              </h3>
              <p className="text-error font-body-md mt-sm">
                ID yang Anda cari tidak ada dalam sistem atau telah dihapus.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Content
  return (
    <div className="space-y-lg">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-sm text-primary font-label-md hover:opacity-80 transition-opacity"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        Kembali ke Hasil Matching
      </button>

      {/* Header Section */}
      <div className="flex flex-col gap-sm">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
          Detail Hasil Matching - {result.id}
        </h1>
        <p className="text-on-surface-variant font-body-md">
          Proses: <span className="font-semibold text-on-surface">{result.processId}</span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
        {/* Dataset A */}
        <div className="bg-surface-container-low rounded-lg border border-outline p-lg">
          <p className="text-on-surface-variant font-label-md text-label-md mb-sm">Dataset A</p>
          <p className="font-headline-md text-headline-md font-bold text-on-surface truncate">{result.datasetA}</p>
        </div>

        {/* Dataset B */}
        <div className="bg-surface-container-low rounded-lg border border-outline p-lg">
          <p className="text-on-surface-variant font-label-md text-label-md mb-sm">Dataset B</p>
          <p className="font-headline-md text-headline-md font-bold text-on-surface truncate">{result.datasetB}</p>
        </div>

        {/* Threshold */}
        <div className="bg-surface-container-low rounded-lg border border-outline p-lg">
          <p className="text-on-surface-variant font-label-md text-label-md mb-sm">Threshold</p>
          <div className="flex items-baseline gap-sm">
            <span className="font-headline-md text-headline-md font-bold text-on-surface">
              {result.threshold.toFixed(2)}
            </span>
            <span className="text-on-surface-variant font-label-md">/ 1.0</span>
          </div>
        </div>

        {/* Match Rate */}
        <div className="bg-surface-container-low rounded-lg border border-outline p-lg">
          <p className="text-on-surface-variant font-label-md text-label-md mb-sm">Tingkat Cocok</p>
          <div className="flex items-baseline gap-sm">
            <span className="font-headline-md text-headline-md font-bold text-success">
              {result.matchRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Process Information */}
      <div className="bg-surface rounded-lg border border-outline p-lg">
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-lg">
          Informasi Proses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {/* Status */}
          <div className="space-y-sm">
            <p className="text-on-surface-variant font-label-md">Status</p>
            <div className={`inline-flex items-center gap-sm px-sm py-xs rounded-lg font-label-md ${
              result.completedAt 
                ? 'bg-success-container text-on-success-container'
                : 'bg-warning-container text-on-warning-container'
            }`}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {result.completedAt ? 'check_circle' : 'pending'}
              </span>
              {result.completedAt ? 'Selesai' : 'Berjalan'}
            </div>
          </div>

          {/* Created Date */}
          <div className="space-y-sm">
            <p className="text-on-surface-variant font-label-md">Tanggal Mulai</p>
            <p className="font-body-md text-on-surface">{formatDate(result.createdAt)}</p>
          </div>

          {/* Completed Date */}
          <div className="space-y-sm">
            <p className="text-on-surface-variant font-label-md">Tanggal Selesai</p>
            <p className="font-body-md text-on-surface">{formatDate(result.completedAt) || '-'}</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-surface rounded-lg border border-outline p-lg">
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-lg">
          Ringkasan Hasil
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
          <div className="space-y-sm">
            <p className="text-on-surface-variant font-label-md">Total Kandidat</p>
            <p className="font-headline-lg text-headline-lg font-bold text-on-surface">
              {result.totalCandidates.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="space-y-sm">
            <p className="text-on-surface-variant font-label-md">Cocok</p>
            <p className="font-headline-lg text-headline-lg font-bold text-success">
              {result.matchCount.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="space-y-sm">
            <p className="text-on-surface-variant font-label-md">Tidak Cocok</p>
            <p className="font-headline-lg text-headline-lg font-bold text-warning">
              {result.nonMatchCount.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="space-y-sm">
            <p className="text-on-surface-variant font-label-md">Belum Ditentukan</p>
            <p className="font-headline-lg text-headline-lg font-bold text-outline">
              {result.unsureCount.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-surface rounded-lg border border-outline overflow-hidden">
        <div className="p-lg border-b border-outline flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            Sampel Rekaman Verifikasi
          </h2>
          <div className="flex items-center gap-sm">
            <label className="text-on-surface-variant font-label-md">Urutkan:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'status' | 'score')}
              className="px-sm py-xs border border-outline rounded-lg font-label-md text-on-surface bg-surface"
            >
              <option value="status">Berdasarkan Status</option>
              <option value="score">Berdasarkan Skor (Tertinggi)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-low border-b border-outline">
              <tr>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                  ID Penugasan
                </th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                  ID Data A / B
                </th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                  Skor
                </th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                  Status
                </th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                  Hasil Verifikasi
                </th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                  Verifikator
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDetails.map((detail) => (
                <tr key={detail.assignmentId} className="border-b border-outline-variant hover:bg-surface-container-low">
                  <td className="p-md">
                    <div className="font-label-md text-label-md text-primary">
                      #{detail.assignmentId}
                    </div>
                  </td>
                  <td className="p-md">
                    <div className="font-body-md text-body-md text-on-surface">
                      <div>{detail.idsbrA}</div>
                      <div className="text-on-surface-variant">{detail.idsbrB}</div>
                    </div>
                  </td>
                  <td className="p-md">
                    <div className="font-label-md text-label-md text-on-surface">
                      {(detail.overallScore * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td className="p-md">
                    <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md ${
                      getStatusColor(detail.status)
                    }`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        {detail.status === 'COMPLETED' ? 'check_circle' : 
                         detail.status === 'IN_PROGRESS' ? 'pending' : 'schedule'}
                      </span>
                      {getStatusLabel(detail.status)}
                    </span>
                  </td>
                  <td className="p-md">
                    {detail.verificationResult ? (
                      <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md ${
                        getVerificationColor(detail.verificationResult)
                      }`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {detail.verificationResult === 'MATCH' ? 'done' :
                           detail.verificationResult === 'NON_MATCH' ? 'close' : 'help'}
                        </span>
                        {detail.verificationResult === 'MATCH' ? 'Cocok' :
                         detail.verificationResult === 'NON_MATCH' ? 'Tidak Cocok' : 'Belum Jelas'}
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">-</span>
                    )}
                  </td>
                  <td className="p-md">
                    <div className="text-on-surface-variant font-body-md">
                      {detail.employeeName || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {details.length === 0 && (
          <div className="py-3xl text-center">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '48px' }}>
              dataset
            </span>
            <p className="text-on-surface-variant font-body-lg mt-md">Belum ada data verifikasi</p>
          </div>
        )}

        <div className="p-lg border-t border-outline bg-surface-container-low">
          <div className="text-on-surface-variant font-body-md">
            Menampilkan {details.length} dari {result.completedCount} penugasan
          </div>
        </div>
      </div>

      {/* Field Scores Detail - Expandable */}
      {details.length > 0 && (
        <div className="bg-surface rounded-lg border border-outline p-lg">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-lg">
            Detail Skor Kolom (Sampel Pertama)
          </h2>

          <div className="space-y-md">
            {details[0]?.fieldScores?.map((field, idx) => (
              <div key={idx} className="flex items-center justify-between p-md bg-surface-container-low rounded-lg">
                <div>
                  <p className="font-label-md text-on-surface-variant">
                    {field.columnA} ↔ {field.columnB}
                  </p>
                </div>
                <div className="flex items-center gap-md">
                  <div className="w-32 h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${field.score * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-label-lg text-label-lg font-bold text-on-surface w-12">
                    {(field.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-surface-container rounded-lg border border-outline p-lg">
        <div className="flex items-start gap-md">
          <span className="material-symbols-outlined text-primary">info</span>
          <div>
            <h3 className="font-label-lg text-label-lg text-on-surface font-semibold mb-sm">
              Tentang Halaman Detail
            </h3>
            <p className="text-on-surface-variant font-body-md">
              Halaman ini menampilkan detail lengkap dari hasil pencocokan data termasuk informasi proses,
              statistik hasil, dan sampel rekaman verifikasi. Data ditampilkan menggunakan mock data Phase 6.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
