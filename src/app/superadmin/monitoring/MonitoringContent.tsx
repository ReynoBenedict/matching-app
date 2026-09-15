/**
 * MonitoringContent - Superadmin monitoring dashboard
 * Phase 6A: All figures are aggregated from the database via
 * /api/superadmin/monitoring. No mock or hardcoded statistics.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import type {
  AssignmentMonitoringStats,
  EmployeeMonitoringProgress,
  MonitoringDashboardData,
} from '@/lib/services/monitoring';

type MonitoringTab = 'penugasan' | 'petugas' | 'proses';

function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}

// ============================================================================
// Helper Components
// ============================================================================

function StatCard({ label, value, icon, tone, subtext }: {
  label: string;
  value: number | string;
  icon: string;
  tone?: string;
  subtext?: string;
}) {
  return (
    <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2 text-on-surface-variant">
        <span className="font-label-md text-xs">{label}</span>
        <span className={`material-symbols-outlined ${tone || 'text-secondary'}`} style={{ fontSize: '20px' }}>
          {icon}
        </span>
      </div>
      <div className="font-headline-lg text-headline-lg text-primary">{value}</div>
      {subtext && (
        <div className="font-label-md text-xs text-on-surface-variant mt-1">{subtext}</div>
      )}
    </div>
  );
}

function ProgressBar({ value, showLabel = true, className = '' }: {
  value: number;
  showLabel?: boolean;
  className?: string;
}) {
  const getColor = (val: number) => {
    if (val >= 80) return 'bg-primary';
    if (val >= 50) return 'bg-secondary';
    return 'bg-warning';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-20 bg-surface-container-highest rounded-full h-2">
        <div
          className={`${getColor(value)} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-on-surface-variant w-10">{value}%</span>}
    </div>
  );
}

function EmployeeStatusBadge({ totalAssigned, completionRate }: {
  totalAssigned: number;
  completionRate: number;
}) {
  let status: string;
  let style: string;

  if (totalAssigned === 0) {
    status = 'Belum Ada Tugas';
    style = 'bg-surface-container-high text-on-surface-variant';
  } else if (completionRate >= 90) {
    status = 'Sangat Baik';
    style = 'bg-success-container text-on-success-container';
  } else if (completionRate >= 75) {
    status = 'Baik';
    style = 'bg-primary-container text-on-primary-container';
  } else if (completionRate >= 50) {
    status = 'Sedang';
    style = 'bg-warning-container text-on-warning-container';
  } else {
    status = 'Perlu Perhatian';
    style = 'bg-error-container text-on-error-container';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${style}`}>
      {status}
    </span>
  );
}

// ============================================================================
// Chart Components
// ============================================================================

function BarChart({ data, height = 200 }: { data: { label: string; value: number }[]; height?: number }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex items-end justify-between gap-2 px-4 pb-4 pt-6" style={{ height }}>
      {data.map((item, idx) => {
        const heightPercent = (item.value / maxValue) * 100;
        const isHigh = heightPercent >= 70;

        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div
              className={`w-full rounded-t-sm transition-colors ${
                isHigh ? 'bg-primary-container hover:bg-primary' : 'bg-secondary-container hover:bg-secondary'
              }`}
              style={{ height: `${heightPercent}%`, minHeight: '4px' }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="font-label-md text-xs text-on-surface-variant truncate max-w-full">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data, size = 160 }: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const innerSize = size * 0.6;

  if (total === 0) {
    return (
      <div
        className="rounded-full border-8 border-surface-container-highest flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="font-label-md text-xs text-on-surface-variant text-center px-2">
          Tidak ada data
        </span>
      </div>
    );
  }

  const gradientStops = data.reduce<{ stops: string; accumulated: number }>(
    (acc, item) => {
      const percentage = (item.value / total) * 100;
      const start = acc.accumulated;
      const end = acc.accumulated + percentage;
      const stop = `${item.color} ${start}% ${end}%`;
      return {
        stops: acc.stops ? `${acc.stops}, ${stop}` : stop,
        accumulated: end,
      };
    },
    { stops: '', accumulated: 0 }
  ).stops;

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${gradientStops})`,
        }}
      />
      <div
        className="absolute rounded-full bg-surface flex flex-col items-center justify-center"
        style={{ width: innerSize, height: innerSize }}
      >
        <span className="font-headline-sm text-primary">{formatNumber(total)}</span>
        <span className="font-label-md text-xs text-on-surface-variant">Total</span>
      </div>
    </div>
  );
}

// ============================================================================
// Assignment Progress Tab
// ============================================================================

function AssignmentProgressSection({ stats, employees }: {
  stats: AssignmentMonitoringStats;
  employees: EmployeeMonitoringProgress[];
}) {
  const distribution = [
    { label: 'Selesai', value: stats.completed, color: '#006493' },
    { label: 'Menunggu Verifikasi', value: stats.pending, color: '#F9A825' },
    { label: 'Sedang Dikerjakan', value: stats.inProgress, color: '#6B7280' },
  ];

  return (
    <div className="space-y-6">
      {/* Assignment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Penugasan" value={formatNumber(stats.total)} icon="assignment" tone="text-secondary" subtext="Seluruh penugasan" />
        <StatCard label="Sudah Selesai" value={formatNumber(stats.completed)} icon="check_circle" tone="text-primary" subtext="Sudah diverifikasi" />
        <StatCard label="Menunggu Verifikasi" value={formatNumber(stats.pending)} icon="pending" tone="text-warning" subtext="Ditugaskan, belum diverifikasi" />
        <StatCard label="Sedang Dikerjakan" value={formatNumber(stats.inProgress)} icon="autorenew" tone="text-secondary" subtext="Sedang diproses petugas" />
        <StatCard label="MATCH" value={formatNumber(stats.matchCount)} icon="thumb_up" tone="text-primary" subtext="Hasil verifikasi petugas" />
        <StatCard label="NON-MATCH" value={formatNumber(stats.nonMatchCount)} icon="thumb_down" tone="text-warning" subtext="Hasil verifikasi petugas" />
      </div>

      {/* Overall Progress */}
      <div className="bg-surface border border-outline-variant rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-headline-sm text-primary">Progres Keseluruhan</h3>
          <span className="font-headline-sm text-primary">{stats.overallProgress}%</span>
        </div>
        <div className="w-full bg-surface-container-highest rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${stats.overallProgress}%` }}
          />
        </div>
        <p className="font-label-md text-xs text-on-surface-variant mt-2">
          {formatNumber(stats.completed)} dari {formatNumber(stats.total)} penugasan telah selesai.
        </p>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Assignment Distribution */}
        <div className="bg-surface border border-outline-variant rounded-xl p-6">
          <h3 className="font-headline-sm text-primary mb-4">Distribusi Penugasan</h3>
          <div className="flex items-center justify-center gap-8">
            <DonutChart data={distribution} />
            <div className="flex flex-col gap-2">
              {distribution.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                  <span className="font-label-md text-xs text-on-surface-variant">{item.label}</span>
                  <span className="font-label-md text-xs text-on-surface font-semibold ml-auto">
                    {formatNumber(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart - Employee Performance */}
        <div className="bg-surface border border-outline-variant rounded-xl p-6">
          <h3 className="font-headline-sm text-primary mb-4">Kinerja Petugas</h3>
          {employees.length === 0 ? (
            <div className="h-[180px] flex flex-col items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[40px] opacity-30">bar_chart</span>
              <p className="font-body-sm text-body-sm mt-2">Belum ada petugas terdaftar.</p>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-lg border border-outline-variant/50">
              <BarChart
                data={employees.map((employee) => ({
                  label: employee.fullName.split(' ')[0],
                  value: employee.completed,
                }))}
                height={180}
              />
            </div>
          )}
          <p className="font-label-md text-xs text-on-surface-variant mt-3 text-center">
            Jumlah penugasan selesai per petugas
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Content Component
// ============================================================================

export function MonitoringContent() {
  const [data, setData] = useState<MonitoringDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MonitoringTab>('penugasan');

  // Pure fetcher — performs no state updates, so it is safe to await anywhere.
  const fetchMonitoringData = useCallback(async (): Promise<MonitoringDashboardData> => {
    const response = await fetch('/api/superadmin/monitoring');
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Gagal memuat data monitoring');
    }

    return payload.data as MonitoringDashboardData;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await fetchMonitoringData();
        if (cancelled) return;
        setData(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data monitoring');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchMonitoringData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await fetchMonitoringData();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data monitoring');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    try {
      const result = await fetchMonitoringData();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data monitoring');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SuperadminLayout pageTitle="Monitoring Progres">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <span className="material-symbols-outlined text-[48px] text-primary inline-block animate-spin">
              hourglass_empty
            </span>
            <p className="font-body-md text-on-surface-variant mt-4">Memuat data monitoring...</p>
          </div>
        </div>
      </SuperadminLayout>
    );
  }

  if (error || !data) {
    return (
      <SuperadminLayout pageTitle="Monitoring Progres">
        <div className="bg-error-container border border-error rounded-xl p-6 mb-6 flex items-start gap-3">
          <span className="material-symbols-outlined text-on-error-container" style={{ fontSize: '24px' }}>
            error
          </span>
          <div>
            <p className="font-body-md text-on-error-container">
              {error || 'Gagal memuat data monitoring'}
            </p>
            <button
              onClick={handleRetry}
              className="mt-3 px-4 py-2 bg-on-error-container text-error-container rounded-lg font-label-md hover:opacity-80"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </SuperadminLayout>
    );
  }

  const { summary, assignments: assignmentStats, employees } = data;

  return (
    <SuperadminLayout pageTitle="Monitoring Progres">
      {/* Back navigation */}
      <Link
        href="/superadmin/dashboard"
        className="inline-flex items-center gap-2 text-secondary font-semibold text-sm mb-4 hover:underline"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Dashboard
      </Link>

      {/* Breadcrumb */}
      <div className="mb-2">
        <span className="text-on-surface-variant text-label-md text-xs">
          Sistem Pencocokan Data /{' '}
          <span className="text-primary font-semibold">Monitoring Progres</span>
        </span>
      </div>

      {/* Page Header */}
      <div className="mb-6 flex flex-wrap justify-between items-end gap-3">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-1">
            Monitoring Progres
          </h2>
          <p className="font-body-md text-on-surface-variant">
            Pantau progres penugasan dan kinerja petugas verifikasi berdasarkan data terkini.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-surface border border-outline-variant text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          <span
            className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}
          >
            refresh
          </span>
          {refreshing ? 'Memperbarui...' : 'Perbarui'}
        </button>
      </div>

      {/* Matching-process metrics (system-level, NOT employee verification) */}
      <div className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            Proses Pencocokan (Skala Sistem)
          </h3>
          <span className="font-label-md text-xs text-on-surface-variant">
            Metrik ini bukan progres verifikasi petugas
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Proses Berjalan"
            value={formatNumber(summary.runningProcesses)}
            icon="sync"
            tone="text-secondary"
            subtext="Riwayat proses pencocokan belum tersedia."
          />
          <StatCard
            label="Proses Selesai"
            value={formatNumber(summary.completedProcesses)}
            icon="check_circle"
            tone="text-primary"
            subtext="Riwayat proses pencocokan belum tersedia."
          />
          <StatCard
            label="Proses Gagal"
            value={formatNumber(summary.failedProcesses)}
            icon="error"
            tone="text-error"
            subtext="Riwayat proses pencocokan belum tersedia."
          />
        </div>
        {summary.runningProcesses + summary.completedProcesses + summary.failedProcesses === 0 && (
          <div className="mt-3 bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0" style={{ fontSize: '20px' }}>
              info
            </span>
            <p className="font-label-md text-xs text-on-surface-variant">
              Riwayat proses pencocokan belum tersedia. Sistem belum menyimpan riwayat proses pencocokan ke basis data,
              sehingga metrik proses ditampilkan sebagai 0. Untuk progres verifikasi, gunakan tab Progres Penugasan dan Progres Petugas.
            </p>
          </div>
        )}
      </div>

      {/* Employee-verification metrics (database-backed) */}
      <div className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            Verifikasi Petugas
          </h3>
          <span className="font-label-md text-xs text-on-surface-variant">
            Berdasarkan data penugasan pada basis data
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Total Petugas"
            value={formatNumber(summary.totalEmployees)}
            icon="groups"
            tone="text-secondary"
            subtext="Akun pegawai terdaftar"
          />
          <StatCard
            label="Rata-rata Penyelesaian"
            value={`${summary.averageCompletionRate}%`}
            icon="trending_up"
            tone="text-primary"
            subtext="Petugas dengan penugasan"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-outline-variant mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('penugasan')}
          className={`px-4 py-2 font-label-md transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'penugasan'
              ? 'text-primary border-primary'
              : 'text-on-surface-variant border-transparent hover:text-on-surface'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>assignment</span>
            Progres Penugasan
          </span>
        </button>
        <button
          onClick={() => setActiveTab('petugas')}
          className={`px-4 py-2 font-label-md transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'petugas'
              ? 'text-primary border-primary'
              : 'text-on-surface-variant border-transparent hover:text-on-surface'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>groups</span>
            Progres Petugas ({formatNumber(employees.length)})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('proses')}
          className={`px-4 py-2 font-label-md transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'proses'
              ? 'text-primary border-primary'
              : 'text-on-surface-variant border-transparent hover:text-on-surface'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
            Proses Pencocokan
          </span>
        </button>
      </div>

      {/* Assignments Tab */}
      {activeTab === 'penugasan' && (
        <AssignmentProgressSection stats={assignmentStats} employees={employees} />
      )}

      {/* Employees Tab */}
      {activeTab === 'petugas' && (
        <div>
          {employees.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-30">
                person_off
              </span>
              <p className="font-body-md text-on-surface-variant mt-4">
                Tidak ada petugas verifikasi.
              </p>
              <p className="font-body-sm text-on-surface-variant mt-1">
                Tambah pegawai dengan role EMPLOYEE untuk melihat progres mereka.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[940px]">
                  <thead>
                    <tr className="bg-surface-container-high border-b border-outline-variant">
                      <th className="px-4 py-3 font-label-md text-label-md text-on-surface">Nama Petugas</th>
                      <th className="px-4 py-3 font-label-md text-label-md text-on-surface text-center">Ditugaskan</th>
                      <th className="px-4 py-3 font-label-md text-label-md text-on-surface text-center">Selesai</th>
                      <th className="px-4 py-3 font-label-md text-label-md text-on-surface text-center whitespace-nowrap">Menunggu Verifikasi</th>
                      <th className="px-4 py-3 font-label-md text-label-md text-on-surface text-center whitespace-nowrap">Sedang Dikerjakan</th>
                      <th className="px-4 py-3 font-label-md text-label-md text-on-surface text-center">Progres</th>
                      <th className="px-4 py-3 font-label-md text-label-md text-on-surface text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee, index) => (
                      <tr
                        key={employee.employeeId}
                        className={`border-b border-outline-variant last:border-b-0 hover:bg-surface-container-highest/40 transition-colors ${
                          index % 2 === 0 ? 'bg-surface' : 'bg-surface-container-low'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-body-md text-on-surface font-semibold flex items-center gap-2">
                              {employee.fullName}
                              {employee.accountStatus !== 'ACTIVE' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-high text-on-surface-variant">
                                  Nonaktif
                                </span>
                              )}
                            </p>
                            <p className="font-label-md text-xs text-on-surface-variant">
                              {employee.email} · {employee.username}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-headline-sm text-on-surface">{formatNumber(employee.totalAssigned)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-headline-sm text-primary">{formatNumber(employee.completed)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-headline-sm text-warning">{formatNumber(employee.pending)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-headline-sm text-secondary">{formatNumber(employee.inProgress)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <ProgressBar value={employee.completionRate} showLabel={false} className="justify-start" />
                            <span className="font-label-md text-xs text-on-surface-variant">
                              {formatNumber(employee.completed)} dari {formatNumber(employee.totalAssigned)} ({employee.completionRate}%)
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <EmployeeStatusBadge
                            totalAssigned={employee.totalAssigned}
                            completionRate={employee.completionRate}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="px-4 py-3 bg-surface-container-high border-t border-outline-variant flex flex-wrap justify-between items-center gap-2">
                <span className="font-label-md text-xs text-on-surface-variant">
                  Total: {formatNumber(employees.length)} petugas
                </span>
                <span className="font-label-md text-xs text-on-surface-variant">
                  Rata-rata progres: {summary.averageCompletionRate}% (petugas dengan penugasan)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Matching Process Tab */}
      {activeTab === 'proses' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-30">
            history_toggle_off
          </span>
          <p className="font-body-md text-on-surface-variant mt-4">
            Belum ada riwayat proses pencocokan yang tersimpan.
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 max-w-[520px] mx-auto">
            Sistem menjalankan pencocokan secara langsung dan belum menyimpan riwayat proses pencocokan ke basis data.
            Karena itu, tidak ada proses berjalan, selesai, maupun gagal yang dapat ditampilkan, dan metrik proses
            ditampilkan sebagai 0. Riwayat akan tampil di sini setelah proses pencocokan mulai dipersistenkan.
          </p>
        </div>
      )}
    </SuperadminLayout>
  );
}
