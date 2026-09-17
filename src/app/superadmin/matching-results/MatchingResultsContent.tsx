/**
 * Hasil pencocokan Superadmin: seluruh kandidat untuk pasangan dataset dan
 * threshold terpilih, digabung dengan data penugasan/verifikasi tersimpan.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CandidateDetailDialog } from '@/components/assignments/CandidateDetailDialog';
import { formatPercent, scoreBadgeClass } from '@/components/assignments/score';
import type {
  MatchingCandidateRow,
  MatchingCandidateSummary,
} from '@/lib/services/matching-results';

const PAGE_SIZE = 20;
const THRESHOLD_OPTIONS = [0.5, 0.6, 0.7, 0.8, 0.9];

interface DatasetOption {
  id: number;
  name: string;
  totalRecords: number | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CandidatesOk {
  success: true;
  rows: MatchingCandidateRow[];
  summary: MatchingCandidateSummary;
  datasetA: { id: number; name: string };
  datasetB: { id: number; name: string };
  pagination: Pagination;
}

interface CandidatesError {
  success: false;
  error: string;
}

type CandidatesResult = CandidatesOk | CandidatesError;

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

/** Pure fetchers — no state updates, safe to await anywhere. */
async function fetchReadyDatasets(): Promise<DatasetOption[]> {
  const response = await fetch('/api/datasets?status=READY&limit=100');
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'Gagal memuat dataset');
  }
  return (payload.data ?? []) as DatasetOption[];
}

async function fetchCandidates(
  datasetAId: number,
  datasetBId: number,
  threshold: number,
  page: number
): Promise<CandidatesResult> {
  const params = new URLSearchParams({
    datasetAId: String(datasetAId),
    datasetBId: String(datasetBId),
    threshold: String(threshold),
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  const response = await fetch(`/api/superadmin/matching-results?${params}`);
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    return { success: false, error: payload.error || 'Gagal memuat hasil pencocokan' };
  }

  return {
    success: true,
    rows: (payload.data ?? []) as MatchingCandidateRow[],
    summary: payload.summary as MatchingCandidateSummary,
    datasetA: payload.datasetA,
    datasetB: payload.datasetB,
    pagination: payload.pagination as Pagination,
  };
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

function StatusPenugasanBadge({ assigned }: { assigned: boolean }) {
  if (assigned) {
    return (
      <span className="inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md bg-secondary-fixed text-on-secondary-fixed">
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment_turned_in</span>
        Sudah Ditugaskan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md bg-surface-container-high text-on-surface-variant">
      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment_late</span>
      Belum Ditugaskan
    </span>
  );
}

function HasilVerifikasiBadge({ result }: { result: MatchingCandidateRow['verificationResult'] }) {
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
  if (result === 'REVIEW') {
    return (
      <span className="inline-flex items-center gap-xs px-sm py-xs rounded-lg font-label-md bg-secondary-fixed text-on-secondary-fixed">
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>rate_review</span>
        PERLU REVIEW
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

function RecordCell({ record, fallbackIdsbr }: {
  record: MatchingCandidateRow['recordA'];
  fallbackIdsbr: string;
}) {
  return (
    <div className="min-w-[180px]">
      <p className="font-data-tabular text-on-surface font-semibold">{record?.idsbr ?? fallbackIdsbr}</p>
      {record?.namaUsaha && (
        <p className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[240px]">
          {record.namaUsaha}
        </p>
      )}
      <p className="font-label-md text-label-md text-secondary truncate max-w-[240px]">
        {record?.datasetName ?? 'Dataset tidak ditemukan'}
      </p>
    </div>
  );
}

export function MatchingResultsContent() {
  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [datasetAId, setDatasetAId] = useState<number | null>(null);
  const [datasetBId, setDatasetBId] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(0.7);
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<MatchingCandidateRow[]>([]);
  const [summary, setSummary] = useState<MatchingCandidateSummary | null>(null);
  const [datasetLabels, setDatasetLabels] = useState<{ a: string; b: string } | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<MatchingCandidateRow | null>(null);

  const applyResult = useCallback((result: CandidatesOk) => {
    setRows(result.rows);
    setSummary(result.summary);
    setDatasetLabels({ a: result.datasetA.name, b: result.datasetB.name });
    setPagination(result.pagination);
  }, []);

  // Load the READY datasets (same source as /datasets and the Penugasan page).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await fetchReadyDatasets();
        if (cancelled) return;

        setDatasets(list);
        if (list.length >= 2) {
          setDatasetAId(list[0].id);
          setDatasetBId(list[1].id);
          setLoading(true);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat dataset');
        setLoading(false);
      } finally {
        if (!cancelled) setDatasetsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load candidates whenever the dataset pair, threshold, or page changes.
  useEffect(() => {
    let cancelled = false;

    if (!datasetAId || !datasetBId) return;

    (async () => {
      try {
        const result = await fetchCandidates(datasetAId, datasetBId, threshold, page);
        if (cancelled) return;

        if (!result.success) {
          setRows([]);
          setSummary(null);
          setError(result.error);
          return;
        }

        applyResult(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setSummary(null);
        setError(err instanceof Error ? err.message : 'Gagal memuat hasil pencocokan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [datasetAId, datasetBId, threshold, page, applyResult]);

  const handleSelectDatasetA = (value: number) => {
    setLoading(true);
    setError(null);
    setPage(1);
    setDatasetAId(value);
  };

  const handleSelectDatasetB = (value: number) => {
    setLoading(true);
    setError(null);
    setPage(1);
    setDatasetBId(value);
  };

  const handleSelectThreshold = (value: number) => {
    setLoading(true);
    setError(null);
    setPage(1);
    setThreshold(value);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === page) return;
    setLoading(true);
    setPage(nextPage);
  };

  const handleRefresh = async () => {
    if (!datasetAId || !datasetBId) return;
    setRefreshing(true);
    try {
      const result = await fetchCandidates(datasetAId, datasetBId, threshold, page);
      if (!result.success) {
        setRows([]);
        setSummary(null);
        setError(result.error);
      } else {
        applyResult(result);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat hasil pencocokan');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetry = async () => {
    if (!datasetAId || !datasetBId) return;
    setLoading(true);
    try {
      const result = await fetchCandidates(datasetAId, datasetBId, threshold, page);
      if (!result.success) {
        setRows([]);
        setSummary(null);
        setError(result.error);
      } else {
        applyResult(result);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat hasil pencocokan');
    } finally {
      setLoading(false);
    }
  };

  const hasDatasetPair = datasets.length >= 2;
  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-lg">
      {/* Back navigation */}
      <Link
        href="/superadmin/dashboard"
        className="inline-flex items-center gap-2 text-primary font-label-md hover:underline"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
        Kembali ke Dashboard
      </Link>

      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-end gap-md">
        <div className="flex flex-col gap-xs">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface">Hasil Matching</h1>
          <p className="text-on-surface-variant font-body-md text-body-md">
            Seluruh kandidat hasil pencocokan untuk pasangan dataset yang dipilih, beserta status penugasan dan hasil verifikasinya.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || !hasDatasetPair}
          className="px-md py-sm bg-surface border border-outline-variant text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors flex items-center gap-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`} style={{ fontSize: '20px' }}>
            refresh
          </span>
          {refreshing ? 'Memperbarui...' : 'Perbarui'}
        </button>
      </div>

      {/* Matching source */}
      <div className="bg-surface rounded-xl border border-outline-variant p-lg">
        <div className="flex items-center gap-sm mb-md">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>
            filter_alt
          </span>
          <h3 className="font-headline-md text-headline-md font-bold text-primary">Sumber Pencocokan</h3>
        </div>

        {datasetsLoading ? (
          <div className="flex items-center gap-sm text-on-surface-variant font-body-md">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            Memuat dataset...
          </div>
        ) : !hasDatasetPair ? (
          <div className="bg-surface-container-low text-on-surface-variant p-md rounded-lg border border-outline-variant text-body-md flex items-start gap-sm">
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '20px' }}>info</span>
            Diperlukan minimal 2 dataset berstatus READY untuk menampilkan hasil pencocokan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label htmlFor="dataset-a" className="block font-label-md text-label-md text-on-surface-variant uppercase mb-xs">
                Dataset A
              </label>
              <select
                id="dataset-a"
                value={datasetAId ?? ''}
                onChange={(event) => handleSelectDatasetA(Number(event.target.value))}
                className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container"
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.totalRecords ?? 0} record)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dataset-b" className="block font-label-md text-label-md text-on-surface-variant uppercase mb-xs">
                Dataset B
              </label>
              <select
                id="dataset-b"
                value={datasetBId ?? ''}
                onChange={(event) => handleSelectDatasetB(Number(event.target.value))}
                className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container"
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.totalRecords ?? 0} record)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="threshold" className="block font-label-md text-label-md text-on-surface-variant uppercase mb-xs">
                Threshold
              </label>
              <select
                id="threshold"
                value={threshold}
                onChange={(event) => handleSelectThreshold(Number(event.target.value))}
                className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container"
              >
                {THRESHOLD_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {Math.round(option * 100)}%
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
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
          <p className="text-on-surface-variant font-body-lg">Menjalankan pencocokan &amp; memuat hasil...</p>
        </div>
      ) : (
        hasDatasetPair && !error && (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-md">
                <StatCard
                  label="Total Kandidat"
                  value={formatNumber(summary.totalCandidates)}
                  icon="fact_check"
                  tone="text-secondary"
                  subtext="Semua kandidat hasil pencocokan"
                />
                <StatCard
                  label="Sudah Ditugaskan"
                  value={formatNumber(summary.assigned)}
                  icon="assignment_turned_in"
                  tone="text-primary"
                  subtext="Dikirim ke petugas"
                />
                <StatCard
                  label="Belum Ditugaskan"
                  value={formatNumber(summary.unassigned)}
                  icon="assignment_late"
                  tone="text-on-surface-variant"
                  subtext="Belum dikirim ke petugas"
                />
                <StatCard
                  label="Belum Diverifikasi"
                  value={formatNumber(summary.unverified)}
                  icon="schedule"
                  tone="text-warning"
                  subtext="Tanpa hasil verifikasi"
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
                  label="Persentase MATCH"
                  value={`${summary.matchPercent}%`}
                  icon="percent"
                  tone="text-primary"
                  subtext={
                    summary.verified === 0
                      ? 'Belum ada data terverifikasi'
                      : `${formatNumber(summary.matchCount)} dari ${formatNumber(summary.verified)} terverifikasi`
                  }
                />
              </div>
            )}

            {/* Results Table */}
            <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
              <div className="p-lg border-b border-outline-variant flex flex-wrap items-center justify-between gap-sm">
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  Daftar Kandidat Hasil Pencocokan
                </h2>
                <span className="text-on-surface-variant font-body-md">
                  {datasetLabels ? `${datasetLabels.a} ↔ ${datasetLabels.b}` : ''} · Total {formatNumber(pagination.total)} kandidat
                </span>
              </div>

              {rows.length === 0 ? (
                <div className="py-3xl text-center">
                  <span className="material-symbols-outlined text-outline" style={{ fontSize: '48px' }}>
                    dataset
                  </span>
                  <p className="text-on-surface-variant font-body-lg mt-md">
                    Tidak ada kandidat yang memenuhi threshold.
                  </p>
                  <p className="text-on-surface-variant font-body-md mt-sm">
                    Coba turunkan threshold atau pilih pasangan dataset lain. Bila riwayat proses pencocokan belum
                    dipersistenkan, halaman ini menampilkan kandidat berdasarkan pencocokan terkini.
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
                        <th className="text-right p-md font-label-lg text-label-lg text-on-surface-variant">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={`${row.recordAId}-${row.recordBId}`}
                          className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors"
                        >
                          <td className="p-md align-top">
                            <RecordCell record={row.recordA} fallbackIdsbr={row.idsbrA} />
                          </td>
                          <td className="p-md align-top">
                            <RecordCell record={row.recordB} fallbackIdsbr={row.idsbrB} />
                          </td>
                          <td className="p-md align-top">
                            <span className={`inline-block px-sm py-xs rounded-lg font-label-md ${scoreBadgeClass(row.overallScore)}`}>
                              {formatPercent(row.overallScore)}
                            </span>
                          </td>
                          <td className="p-md align-top">
                            <StatusPenugasanBadge assigned={row.assigned} />
                          </td>
                          <td className="p-md align-top">
                            <HasilVerifikasiBadge result={row.verificationResult} />
                          </td>
                          <td className="p-md align-top">
                            {row.assignedEmployee ? (
                              <span className="font-body-md text-on-surface">{row.assignedEmployee.fullName}</span>
                            ) : (
                              <span className="text-on-surface-variant">-</span>
                            )}
                          </td>
                          <td className="p-md align-top">
                            <span className="text-on-surface-variant font-body-md">
                              {formatDateTime(row.verifiedAt)}
                            </span>
                          </td>
                          <td className="p-md align-top text-right whitespace-nowrap">
                            <button
                              onClick={() => setDetailTarget(row)}
                              className="px-md py-xs rounded-lg border border-outline text-primary font-label-md hover:bg-surface-container-low transition-colors"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer / pagination */}
              <div className="p-lg border-t border-outline bg-surface-container-low flex flex-wrap items-center justify-between gap-sm">
                <span className="text-on-surface-variant font-body-md">
                  Menampilkan {formatNumber(rangeStart)}-{formatNumber(rangeEnd)} dari {formatNumber(pagination.total)} kandidat
                </span>
                <div className="flex items-center gap-sm">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-md py-xs rounded-lg border border-outline text-on-surface font-label-md hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Halaman {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-md py-xs rounded-lg border border-outline text-on-surface font-label-md hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Berikutnya
                  </button>
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
                  <p className="text-on-surface-variant font-body-md">
                    Kandidat dihitung langsung oleh proses pencocokan untuk pasangan dataset dan threshold yang dipilih,
                    sehingga mencakup kandidat yang belum ditugaskan. Nama dataset diambil dari Manajemen Dataset.
                  </p>
                  <p className="text-on-surface-variant font-body-md mt-sm">
                    Persentase MATCH dihitung hanya dari kandidat yang sudah terverifikasi
                    (MATCH / (MATCH + NON-MATCH)), bukan dari seluruh kandidat.
                  </p>
                </div>
              </div>
            </div>
          </>
        )
      )}

      {/* Detail dialog */}
      {detailTarget && (
        <CandidateDetailDialog candidate={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
    </div>
  );
}
