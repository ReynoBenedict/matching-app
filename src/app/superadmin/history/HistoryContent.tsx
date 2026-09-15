/**
 * HistoryContent - Riwayat Proses (audit logs)
 * Every row and count comes from the `audit_logs` table via
 * /api/superadmin/history. No mock data.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { describeAuditLog, getAuditActionMeta } from '@/lib/constants/audit-actions';
import type {
  HistoryEntry,
  HistoryFilterOptions,
  HistorySummary,
} from '@/lib/services/history';

const PAGE_SIZE = 10;

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface HistoryResponse {
  entries: HistoryEntry[];
  summary: HistorySummary;
  pagination: Pagination;
  filters: HistoryFilterOptions;
}

function fetchHistory(
  filters: { action: string; userId: string; from: string; to: string; page: number }
): Promise<HistoryResponse> {
  const params = new URLSearchParams();
  if (filters.action && filters.action !== 'ALL') params.set('action', filters.action);
  if (filters.userId && filters.userId !== 'ALL') params.set('userId', filters.userId);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  params.set('page', String(filters.page));
  params.set('limit', String(PAGE_SIZE));

  return fetch(`/api/superadmin/history?${params}`).then(async (response) => {
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Gagal memuat riwayat proses');
    }
    return {
      entries: (payload.data ?? []) as HistoryEntry[],
      summary: payload.summary as HistorySummary,
      pagination: payload.pagination as Pagination,
      filters: payload.filters as HistoryFilterOptions,
    };
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="bg-surface-container-low rounded-lg border border-outline p-lg">
      <p className="text-on-surface-variant font-label-md text-label-md">{label}</p>
      <p className={`font-headline-lg text-headline-lg font-bold mt-xs ${tone || 'text-on-surface'}`}>
        {value.toLocaleString('id-ID')}
      </p>
    </div>
  );
}

export function HistoryContent() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [filterOptions, setFilterOptions] = useState<HistoryFilterOptions>({ actions: [], users: [] });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyResult = useCallback((result: HistoryResponse) => {
    setEntries(result.entries);
    setSummary(result.summary);
    setPagination(result.pagination);
    setFilterOptions(result.filters);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await fetchHistory({
          action: actionFilter,
          userId: userFilter,
          from: fromDate,
          to: toDate,
          page,
        });
        if (cancelled) return;
        applyResult(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat riwayat proses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actionFilter, userFilter, fromDate, toDate, page, applyResult]);

  const reload = async (nextPage: number) => {
    setLoading(true);
    try {
      const result = await fetchHistory({
        action: actionFilter,
        userId: userFilter,
        from: fromDate,
        to: toDate,
        page: nextPage,
      });
      applyResult(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat riwayat proses');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await fetchHistory({
        action: actionFilter,
        userId: userFilter,
        from: fromDate,
        to: toDate,
        page,
      });
      applyResult(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat riwayat proses');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setLoading(true);
    setError(null);
    setPage(1);
    setter(value);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === page) return;
    setLoading(true);
    setPage(nextPage);
  };

  const handleReset = () => {
    setLoading(true);
    setError(null);
    setPage(1);
    setActionFilter('ALL');
    setUserFilter('ALL');
    setFromDate('');
    setToDate('');
  };

  const hasFilters =
    actionFilter !== 'ALL' || userFilter !== 'ALL' || fromDate !== '' || toDate !== '';

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-lg">
      {/* Back navigation */}
      <Link
        href="/superadmin/dashboard"
        className="inline-flex items-center gap-sm text-secondary font-label-md hover:underline"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        Kembali ke Dashboard
      </Link>

      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-end gap-md">
        <div className="flex flex-col gap-xs">
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Riwayat Proses</h1>
          <p className="text-on-surface-variant font-body-md text-body-md">
            Log audit aktivitas sistem yang tercatat pada basis data.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-md py-sm bg-surface border border-outline text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors flex items-center gap-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`} style={{ fontSize: '20px' }}>
            refresh
          </span>
          {refreshing ? 'Memperbarui...' : 'Perbarui'}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-md">
          <SummaryCard label="Total Aktivitas" value={summary.total} />
          <SummaryCard label="Pencocokan Dimulai" value={summary.matchingStarts} tone="text-secondary" />
          <SummaryCard label="Pencocokan Selesai" value={summary.matchingCompletes} tone="text-primary" />
          <SummaryCard label="Pencocokan Gagal" value={summary.matchingFails} tone="text-error" />
          <SummaryCard label="Verifikasi Disubmit" value={summary.verifications} tone="text-primary" />
          <SummaryCard label="Login" value={summary.logins} />
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface rounded-lg border border-outline p-lg">
        <div className="flex items-center justify-between mb-lg">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            Filter dan Pencarian
          </h2>
          <button
            onClick={handleReset}
            disabled={!hasFilters}
            className="flex items-center gap-sm px-sm py-xs text-primary font-label-md hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>clear_all</span>
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          <div className="flex flex-col gap-sm">
            <label htmlFor="filter-action" className="font-label-lg text-label-lg text-on-surface font-semibold">
              Jenis Aktivitas
            </label>
            <select
              id="filter-action"
              value={actionFilter}
              onChange={(event) => handleFilterChange(setActionFilter)(event.target.value)}
              className="px-md py-sm border border-outline rounded-lg font-body-md text-on-surface bg-surface"
            >
              <option value="ALL">Semua Aktivitas</option>
              {filterOptions.actions.map((action) => (
                <option key={action} value={action}>
                  {getAuditActionMeta(action).label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-sm">
            <label htmlFor="filter-user" className="font-label-lg text-label-lg text-on-surface font-semibold">
              Pengguna
            </label>
            <select
              id="filter-user"
              value={userFilter}
              onChange={(event) => handleFilterChange(setUserFilter)(event.target.value)}
              className="px-md py-sm border border-outline rounded-lg font-body-md text-on-surface bg-surface"
            >
              <option value="ALL">Semua Pengguna</option>
              {filterOptions.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-sm">
            <label htmlFor="filter-from" className="font-label-lg text-label-lg text-on-surface font-semibold">
              Dari Tanggal
            </label>
            <input
              id="filter-from"
              type="date"
              value={fromDate}
              onChange={(event) => handleFilterChange(setFromDate)(event.target.value)}
              className="px-md py-sm border border-outline rounded-lg font-body-md text-on-surface bg-surface"
            />
          </div>

          <div className="flex flex-col gap-sm">
            <label htmlFor="filter-to" className="font-label-lg text-label-lg text-on-surface font-semibold">
              Hingga Tanggal
            </label>
            <input
              id="filter-to"
              type="date"
              value={toDate}
              onChange={(event) => handleFilterChange(setToDate)(event.target.value)}
              className="px-md py-sm border border-outline rounded-lg font-body-md text-on-surface bg-surface"
            />
          </div>
        </div>

        <div className="mt-lg pt-lg border-t border-outline">
          <p className="text-on-surface-variant font-body-md">
            Menampilkan <span className="font-semibold text-on-surface">{pagination.total.toLocaleString('id-ID')}</span> aktivitas
            {hasFilters ? ' sesuai filter' : ''}
          </p>
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
              onClick={() => reload(page)}
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
          <p className="text-on-surface-variant font-body-lg">Memuat riwayat proses...</p>
        </div>
      ) : (
        !error && (
          <div className="bg-surface rounded-lg border border-outline overflow-hidden">
            {entries.length === 0 ? (
              <div className="py-3xl text-center">
                <span className="material-symbols-outlined text-outline" style={{ fontSize: '48px' }}>
                  history
                </span>
                <p className="text-on-surface-variant font-body-lg mt-md">
                  {hasFilters ? 'Tidak ada aktivitas yang sesuai filter.' : 'Belum ada aktivitas tercatat.'}
                </p>
                <p className="text-on-surface-variant font-body-md mt-sm">
                  {hasFilters
                    ? 'Coba ubah filter atau reset untuk melihat semua aktivitas.'
                    : 'Aktivitas akan muncul di sini setelah pengguna melakukan aksi pada sistem.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px]">
                  <thead className="bg-surface-container-low border-b border-outline">
                    <tr>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Waktu</th>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Aktivitas</th>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Pengguna</th>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Deskripsi</th>
                      <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Entitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      const meta = getAuditActionMeta(entry.action);
                      return (
                        <tr key={entry.id} className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
                          <td className="p-md align-top">
                            <span className="text-on-surface-variant font-body-sm">
                              {formatDateTime(entry.createdAt)}
                            </span>
                          </td>
                          <td className="p-md align-top">
                            <div className="flex items-center gap-sm">
                              <span className={`material-symbols-outlined ${meta.color}`} style={{ fontSize: '20px' }}>
                                {meta.icon}
                              </span>
                              <span className="font-label-md text-on-surface">{meta.label}</span>
                            </div>
                          </td>
                          <td className="p-md align-top">
                            <span className="text-on-surface font-body-md">
                              {entry.userName ?? '-'}
                            </span>
                          </td>
                          <td className="p-md align-top">
                            <span className="text-on-surface-variant font-body-md">
                              {describeAuditLog(entry.action, entry.metadata, entry.entityType, entry.entityId)}
                            </span>
                          </td>
                          <td className="p-md align-top">
                            {entry.entityType && entry.entityId != null ? (
                              <span className="px-sm py-xs bg-primary-container text-on-primary-container rounded-lg font-label-md whitespace-nowrap">
                                {entry.entityType} #{entry.entityId}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="p-lg border-t border-outline bg-surface-container-low flex flex-wrap items-center justify-between gap-sm">
              <span className="text-on-surface-variant font-body-md">
                Menampilkan {rangeStart.toLocaleString('id-ID')}-{rangeEnd.toLocaleString('id-ID')} dari {pagination.total.toLocaleString('id-ID')} aktivitas
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
        )
      )}

      {/* Info Panel */}
      <div className="bg-surface-container rounded-lg border border-outline p-lg">
        <div className="flex items-start gap-md">
          <span className="material-symbols-outlined text-primary">info</span>
          <div>
            <h3 className="font-label-lg text-label-lg text-on-surface font-semibold mb-sm">
              Tentang Halaman Riwayat Proses
            </h3>
            <p className="text-on-surface-variant font-body-md">
              Seluruh entri dan angka pada halaman ini diambil langsung dari tabel log audit sistem. Ringkasan di atas
              mengikuti filter yang sedang aktif; aktivitas yang tidak pernah dicatat oleh backend akan bernilai 0.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
