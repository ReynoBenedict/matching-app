'use client';

import { useState, useEffect, useMemo } from 'react';
import type { HistoryRecord, HistoryActionType } from '@/types/phase6';
import { mockHistoryRecords, historyActionMeta, mockHistoryStatistics } from '@/lib/mock/phase6';

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterAction, setFilterAction] = useState<HistoryActionType | 'ALL'>('ALL');
  const [filterUser, setFilterUser] = useState<string>('ALL');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      // Sort by date descending
      const sorted = [...mockHistoryRecords].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecords(sorted);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Get unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const users = new Set(records.map(r => r.userName).filter(Boolean));
    return Array.from(users).sort();
  }, [records]);

  // Reset page when filters change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setCurrentPage(1);
  }, [filterAction, filterUser, dateRangeStart, dateRangeEnd]);

  // Apply filters
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Filter by action
      if (filterAction !== 'ALL' && record.action !== filterAction) {
        return false;
      }

      // Filter by user
      if (filterUser !== 'ALL' && record.userName !== filterUser) {
        return false;
      }

      // Filter by date range
      if (dateRangeStart) {
        const recordDate = new Date(record.createdAt);
        const startDate = new Date(dateRangeStart);
        if (recordDate < startDate) return false;
      }

      if (dateRangeEnd) {
        const recordDate = new Date(record.createdAt);
        const endDate = new Date(dateRangeEnd);
        endDate.setHours(23, 59, 59, 999); // End of day
        if (recordDate > endDate) return false;
      }

      return true;
    });
  }, [records, filterAction, filterUser, dateRangeStart, dateRangeEnd]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIdx = (currentPage - 1) * recordsPerPage;
  const paginatedRecords = filteredRecords.slice(startIdx, startIdx + recordsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionMeta = (action: HistoryActionType) => {
    return historyActionMeta[action] || { label: action, icon: 'info', color: 'text-on-surface-variant' };
  };

  const handleReset = () => {
    setFilterAction('ALL');
    setFilterUser('ALL');
    setDateRangeStart('');
    setDateRangeEnd('');
    setCurrentPage(1);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setRecords([...mockHistoryRecords].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      setLoading(false);
    }, 800);
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-3xl gap-md">
        <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>
          progress_activity
        </span>
        <p className="text-on-surface-variant font-body-lg">Memuat riwayat proses...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-lg">
        <div className="flex flex-col gap-base">
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Riwayat Proses</h1>
          <p className="text-on-surface-variant font-body-md">
            Log audit dan aktivitas sistem pencocokan data.
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

  // Main Content
  return (
    <div className="space-y-lg">
      {/* Page Header */}
      <div className="flex flex-col gap-base">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Riwayat Proses</h1>
        <p className="text-on-surface-variant font-body-md">
          Log audit dan aktivitas sistem pencocokan data.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-lg">
        <div className="bg-surface-container-low rounded-lg border border-outline p-lg">
          <p className="text-on-surface-variant font-label-md text-label-md">Total Aktivitas</p>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-xs">
            {mockHistoryStatistics.totalRecords}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-lg border border-outline p-lg">
          <p className="text-on-surface-variant font-label-md text-label-md">Pencocokan Dimulai</p>
          <p className="font-headline-lg text-headline-lg font-bold text-primary mt-xs">
            {mockHistoryStatistics.matchingStarts}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-lg border border-outline p-lg">
          <p className="text-on-surface-variant font-label-md text-label-md">Pencocokan Selesai</p>
          <p className="font-headline-lg text-headline-lg font-bold text-success mt-xs">
            {mockHistoryStatistics.matchingCompletes}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-lg border border-outline p-lg">
          <p className="text-on-surface-variant font-label-md text-label-md">Pencocokan Gagal</p>
          <p className="font-headline-lg text-headline-lg font-bold text-error mt-xs">
            {mockHistoryStatistics.matchingFails}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-lg border border-outline p-lg">
          <p className="text-on-surface-variant font-label-md text-label-md">Verifikasi Disubmit</p>
          <p className="font-headline-lg text-headline-lg font-bold text-primary mt-xs">
            {mockHistoryStatistics.verifications}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-lg border border-outline p-lg">
          <p className="text-on-surface-variant font-label-md text-label-md">Login</p>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-xs">
            {mockHistoryStatistics.logins}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-lg border border-outline p-lg">
        <div className="flex items-center justify-between mb-lg">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            Filter dan Pencarian
          </h2>
          <button
            onClick={handleReset}
            className="flex items-center gap-sm px-sm py-xs text-primary font-label-md hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              clear_all
            </span>
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          {/* Action Filter */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-lg text-label-lg text-on-surface font-semibold">
              Jenis Aktivitas
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value as HistoryActionType | 'ALL')}
              className="px-md py-sm border border-outline rounded-lg font-body-md text-on-surface bg-surface"
            >
              <option value="ALL">Semua Aktivitas</option>
              <option value="MATCHING_START">Mulai Pencocokan</option>
              <option value="MATCHING_COMPLETE">Pencocokan Selesai</option>
              <option value="MATCHING_FAIL">Pencocokan Gagal</option>
              <option value="ASSIGNMENT_CREATE">Buat Penugasan</option>
              <option value="ASSIGNMENT_COMPLETE">Penugasan Selesai</option>
              <option value="VERIFICATION_SUBMIT">Submit Verifikasi</option>
              <option value="DATASET_UPLOAD">Upload Dataset</option>
              <option value="USER_LOGIN">Login</option>
              <option value="USER_LOGOUT">Logout</option>
            </select>
          </div>

          {/* User Filter */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-lg text-label-lg text-on-surface font-semibold">
              Pengguna
            </label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-md py-sm border border-outline rounded-lg font-body-md text-on-surface bg-surface"
            >
              <option value="ALL">Semua Pengguna</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Date Start */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-lg text-label-lg text-on-surface font-semibold">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="px-md py-sm border border-outline rounded-lg font-body-md text-on-surface bg-surface"
            />
          </div>

          {/* Date End */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-lg text-label-lg text-on-surface font-semibold">
              Hingga Tanggal
            </label>
            <input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="px-md py-sm border border-outline rounded-lg font-body-md text-on-surface bg-surface"
            />
          </div>
        </div>

        <div className="mt-lg pt-lg border-t border-outline">
          <p className="text-on-surface-variant font-body-md">
            Menampilkan <span className="font-semibold text-on-surface">{filteredRecords.length}</span> dari{' '}
            <span className="font-semibold text-on-surface">{records.length}</span> aktivitas
          </p>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-surface rounded-lg border border-outline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-low border-b border-outline">
              <tr>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                  Waktu
                </th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                  Aktivitas
                </th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                  Pengguna
                </th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                  Deskripsi
                </th>
                <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                  Entitas
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((record) => {
                const meta = getActionMeta(record.action);
                return (
                  <tr key={record.id} className="border-b border-outline-variant hover:bg-surface-container-low">
                    <td className="p-md">
                      <div className="text-on-surface-variant font-body-sm">
                        {formatDate(record.createdAt)}
                      </div>
                    </td>
                    <td className="p-md">
                      <div className="flex items-center gap-sm">
                        <span className={`material-symbols-outlined ${meta.color}`} style={{ fontSize: '20px' }}>
                          {meta.icon}
                        </span>
                        <span className="font-label-md text-on-surface">{meta.label}</span>
                      </div>
                    </td>
                    <td className="p-md">
                      <div className="text-on-surface font-body-md">
                        {record.userName || '-'}
                      </div>
                    </td>
                    <td className="p-md">
                      <div className="text-on-surface-variant font-body-md">
                        {record.description}
                      </div>
                    </td>
                    <td className="p-md">
                      <div className="font-body-md">
                        {record.entityType && record.entityId ? (
                          <span className="px-sm py-xs bg-primary-container text-on-primary-container rounded-lg font-label-md">
                            {record.entityType} #{record.entityId}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="py-3xl text-center">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '48px' }}>
              history
            </span>
            <p className="text-on-surface-variant font-body-lg mt-md">Tidak ada aktivitas yang sesuai dengan filter</p>
            <p className="text-on-surface-variant font-body-md mt-sm">
              Coba ubah filter atau reset untuk melihat semua aktivitas
            </p>
          </div>
        )}

        <div className="p-lg border-t border-outline bg-surface-container-low">
          <div className="flex items-center justify-between">
            <div className="text-on-surface-variant font-body-md">
              Halaman {currentPage} dari {Math.max(1, totalPages)} ({filteredRecords.length} aktivitas)
            </div>
            <div className="flex gap-sm">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-md py-sm border border-outline rounded-lg text-on-surface font-label-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container disabled:hover:bg-transparent"
              >
                <span className="material-symbols-outlined align-middle" style={{ fontSize: '20px' }}>
                  chevron_left
                </span>
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-md py-sm border border-outline rounded-lg text-on-surface font-label-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container disabled:hover:bg-transparent"
              >
                <span className="material-symbols-outlined align-middle" style={{ fontSize: '20px' }}>
                  chevron_right
                </span>
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
              Tentang Halaman Riwayat Proses
            </h3>
            <p className="text-on-surface-variant font-body-md mb-sm">
              Halaman ini menampilkan log audit lengkap dari semua aktivitas dalam sistem pencocokan data.
              Setiap entri mencakup waktu kejadian, jenis aktivitas, pengguna yang melakukan aksi, deskripsi,
              dan entitas yang terlibat.
            </p>
            <p className="text-on-surface-variant font-body-md">
              Gunakan filter untuk mencari aktivitas spesifik berdasarkan jenis, pengguna, atau rentang tanggal.
              Data ditampilkan menggunakan mock data Phase 6.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
