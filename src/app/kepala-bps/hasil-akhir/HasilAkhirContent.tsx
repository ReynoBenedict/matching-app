/**
 * Hasil akhir verifikasi kandidat untuk Kepala BPS (hanya-baca), dibaca dari
 * basis data melalui /api/kepala-bps/hasil-akhir.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPercent, scoreBadgeClass } from '@/components/assignments/score';
import type {
  FinalResultRow,
  FinalResultSummary,
  VerificationFilter,
} from '@/lib/services/final-results';

const PAGE_SIZE = 20;

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface HasilAkhirResponse {
  rows: FinalResultRow[];
  summary: FinalResultSummary;
  pagination: Pagination;
}

function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({ label, value, icon, tone, subtext }: {
  label: string;
  value: number | string;
  icon: string;
  tone?: string;
  subtext?: string;
}) {
  return (
    <div className="bg-surface p-lg rounded-xl border border-outline-variant shadow-sm">
      <div className="flex items-center justify-between mb-sm text-on-surface-variant">
        <span className="font-label-md text-label-md">{label}</span>
        <span className={`material-symbols-outlined ${tone || 'text-secondary'}`} style={{ fontSize: '20px' }}>
          {icon}
        </span>
      </div>
      <div className="font-headline-lg text-headline-lg font-bold text-primary">{value}</div>
      {subtext && (
        <div className="font-label-md text-label-md text-on-surface-variant mt-xs">{subtext}</div>
      )}
    </div>
  );
}

function StatusPenugasanBadge({ status }: { status: FinalResultRow['status'] }) {
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md bg-success-container text-on-success-container">
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
        Selesai
      </span>
    );
  }
  if (status === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md bg-secondary-fixed text-on-secondary-fixed">
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>pending</span>
        Sedang Dikerjakan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md bg-warning-container text-on-warning-container">
      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
      Menunggu Verifikasi
    </span>
  );
}

function HasilVerifikasiBadge({ result }: { result: FinalResultRow['verificationResult'] }) {
  if (result === 'MATCH') {
    return (
      <span className="inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md bg-success-container text-on-success-container">
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>done</span>
        MATCH
      </span>
    );
  }
  if (result === 'NON_MATCH') {
    return (
      <span className="inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md bg-error-container text-on-error-container">
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
        NON-MATCH
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md bg-surface-container-high text-on-surface-variant">
      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>help</span>
      Belum Diverifikasi
    </span>
  );
}

function RecordCell({ record }: { record: FinalResultRow['recordA'] }) {
  if (!record) {
    return <span className="text-on-surface-variant">-</span>;
  }
  return (
    <div className="min-w-[180px]">
      <p className="font-data-tabular text-on-surface font-semibold">{record.idsbr}</p>
      <p className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[240px]">
        {record.namaUsaha}
      </p>
      <p className="font-label-md text-label-md text-secondary truncate max-w-[240px]">
        {record.datasetName ?? 'Dataset tidak ditemukan'}
      </p>
    </div>
  );
}

export function HasilAkhirContent() {
  const [rows, setRows] = useState<FinalResultRow[]>([]);
  const [summary, setSummary] = useState<FinalResultSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [verification, setVerification] = useState<VerificationFilter>('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pengambil data murni tanpa perubahan state.
  const fetchResults = useCallback(
    async (filter: VerificationFilter, pageToLoad: number): Promise<HasilAkhirResponse> => {
      const params = new URLSearchParams({
        verification: filter,
        page: String(pageToLoad),
        limit: String(PAGE_SIZE),
      });

      const response = await fetch(`/api/kepala-bps/hasil-akhir?${params}`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Gagal memuat hasil akhir');
      }

      return {
        rows: (payload.data ?? []) as FinalResultRow[],
        summary: payload.summary as FinalResultSummary,
        pagination: payload.pagination as Pagination,
      };
    },
    []
  );

  const applyResult = useCallback((result: HasilAkhirResponse) => {
    setRows(result.rows);
    setSummary(result.summary);
    setPagination(result.pagination);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await fetchResults(verification, page);
        if (cancelled) return;
        applyResult(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat hasil akhir');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [verification, page, fetchResults, applyResult]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await fetchResults(verification, page);
      applyResult(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat hasil akhir');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    try {
      const result = await fetchResults(verification, page);
      applyResult(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat hasil akhir');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value: VerificationFilter) => {
    setLoading(true);
    setError(null);
    setPage(1);
    setVerification(value);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === page) return;
    setLoading(true);
    setPage(nextPage);
  };

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-lg">
      {/* Back navigation */}
      <Link
        href="/kepala-bps/dashboard"
        className="inline-flex items-center gap-2 text-primary font-label-md hover:underline"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
        Kembali ke Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-md">
        <div className="flex flex-col gap-xs">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface">Hasil Akhir</h1>
          <p className="text-on-surface-variant font-body-md text-body-md">
            Hasil akhir verifikasi kandidat pencocokan data yang tersimpan di basis data.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-md py-sm bg-surface border border-outline-variant text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors flex items-center gap-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`} style={{ fontSize: '20px' }}>
            refresh
          </span>
          {refreshing ? 'Memperbarui...' : 'Perbarui'}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-md">
          <StatCard
            label="Total Kandidat"
            value={formatNumber(summary.totalCandidates)}
            icon="fact_check"
            tone="text-secondary"
            subtext="Kandidat pencocokan tersimpan"
          />
          <StatCard
            label="MATCH"
            value={formatNumber(summary.matchCount)}
            icon="thumb_up"
            tone="text-primary"
            subtext="Hasil verifikasi cocok"
          />
          <StatCard
            label="NON-MATCH"
            value={formatNumber(summary.nonMatchCount)}
            icon="thumb_down"
            tone="text-error"
            subtext="Hasil verifikasi tidak cocok"
          />
          <StatCard
            label="Belum Diverifikasi"
            value={formatNumber(summary.unverified)}
            icon="schedule"
            tone="text-warning"
            subtext="Menunggu verifikasi petugas"
          />
          <StatCard
            label="Tingkat Verifikasi"
            value={`${summary.verificationRate}%`}
            icon="verified"
            tone="text-primary"
            subtext="Kandidat yang sudah diverifikasi"
          />
        </div>
      )}

      {/* Filter */}
      <div className="bg-surface rounded-xl border border-outline-variant p-lg">
        <div className="flex flex-wrap items-center justify-between gap-md">
          <h2 className="font-headline-md text-headline-md font-bold text-primary">Filter Hasil</h2>
          <div className="flex items-center gap-sm">
            <label htmlFor="filter-verifikasi" className="font-label-md text-label-md text-on-surface-variant">
              Hasil Verifikasi
            </label>
            <select
              id="filter-verifikasi"
              value={verification}
              onChange={(event) => handleFilterChange(event.target.value as VerificationFilter)}
              className="px-md py-sm border border-outline-variant rounded-lg font-body-md text-on-surface bg-surface"
            >
              <option value="ALL">Semua</option>
              <option value="MATCH">MATCH</option>
              <option value="NON_MATCH">NON-MATCH</option>
              <option value="UNVERIFIED">Belum Diverifikasi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-error-container border-l-4 border-error p-lg rounded-lg">
          <div className="flex items-start justify-between gap-md">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-error">error</span>
              <p className="text-on-error-container font-body-md">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-md py-sm bg-error text-on-error font-label-md rounded-lg hover:opacity-90 transition-opacity"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-3xl gap-md">
          <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>
            progress_activity
          </span>
          <p className="text-on-surface-variant font-body-lg">Memuat hasil akhir...</p>
        </div>
      ) : (
        !error && (
          <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
            <div className="p-lg border-b border-outline-variant flex flex-wrap items-center justify-between gap-sm">
              <h2 className="font-headline-md text-headline-md font-bold text-primary">
                Daftar Hasil Akhir
              </h2>
              <span className="text-on-surface-variant font-body-md">
                Total {formatNumber(pagination.total)} hasil
              </span>
            </div>

            {rows.length === 0 ? (
              <div className="py-3xl text-center">
                <span className="material-symbols-outlined text-outline" style={{ fontSize: '48px' }}>
                  inbox
                </span>
                <p className="text-on-surface-variant font-body-lg mt-md">
                  Belum ada hasil verifikasi tersimpan.
                </p>
                <p className="text-on-surface-variant font-body-md mt-sm">
                  {verification === 'ALL'
                    ? 'Hasil akan muncul di sini setelah kandidat pencocokan ditugaskan dan diverifikasi petugas.'
                    : 'Tidak ada data yang sesuai filter ini. Coba pilih filter lain.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-surface-container-low border-b border-outline">
                    <tr>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Record A</th>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Record B</th>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Skor Kesamaan</th>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Status Penugasan</th>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Hasil Verifikasi</th>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Petugas</th>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Waktu Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.assignmentId}
                        className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors"
                      >
                        <td className="p-md align-top">
                          <RecordCell record={row.recordA} />
                        </td>
                        <td className="p-md align-top">
                          <RecordCell record={row.recordB} />
                        </td>
                        <td className="p-md align-top">
                          <span className={`inline-block px-sm py-xs rounded-lg font-label-md ${scoreBadgeClass(Number(row.similarityScore))}`}>
                            {formatPercent(Number(row.similarityScore))}
                          </span>
                        </td>
                        <td className="p-md align-top">
                          <StatusPenugasanBadge status={row.status} />
                        </td>
                        <td className="p-md align-top">
                          <HasilVerifikasiBadge result={row.verificationResult} />
                        </td>
                        <td className="p-md align-top">
                          <span className="font-body-md text-on-surface">
                            {row.employee?.fullName ?? '-'}
                          </span>
                        </td>
                        <td className="p-md align-top">
                          <span className="text-on-surface-variant font-body-md">
                            {formatDateTime(row.verifiedAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="p-lg border-t border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-sm">
              <span className="text-on-surface-variant font-body-md">
                Menampilkan {formatNumber(rangeStart)}-{formatNumber(rangeEnd)} dari {formatNumber(pagination.total)} hasil
              </span>
              <div className="flex items-center gap-sm">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-md py-xs rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Halaman {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-md py-xs rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
        )
      )}

    </div>
  );
}
