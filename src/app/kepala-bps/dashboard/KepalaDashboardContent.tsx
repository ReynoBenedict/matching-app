/**
 * KepalaDashboardContent - read-only executive dashboard
 * Every figure, name and activity comes from the database via
 * /api/kepala-bps/dashboard. No mock or hardcoded statistics.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeAuditLog, getAuditActionMeta } from '@/lib/constants/audit-actions';
import type { KepalaDashboardData } from '@/lib/services/kepala-dashboard';
import type { EmployeeMonitoringProgress } from '@/lib/services/monitoring';
import type { HistoryEntry } from '@/lib/services/history';

function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
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

function StatCard({ label, value, icon, tone, subtext }: {
  label: string;
  value: number | string;
  icon: string;
  tone?: string;
  subtext?: string;
}) {
  return (
    <div className="bg-surface-container-low p-lg rounded-xl border border-outline shadow-sm">
      <div className="flex items-center justify-between mb-sm text-on-surface-variant">
        <span className="font-label-md text-label-md">{label}</span>
        <span className={`material-symbols-outlined ${tone || 'text-secondary'}`} style={{ fontSize: '20px' }}>
          {icon}
        </span>
      </div>
      <div className="font-headline-lg text-headline-lg font-bold text-on-surface">{value}</div>
      {subtext && (
        <div className="font-label-md text-label-md text-on-surface-variant mt-xs">{subtext}</div>
      )}
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

export function KepalaDashboardContent() {
  const [data, setData] = useState<KepalaDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pure fetcher — performs no state updates, so it is safe to await anywhere.
  const fetchDashboard = useCallback(async (): Promise<KepalaDashboardData> => {
    const response = await fetch('/api/kepala-bps/dashboard');
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Gagal memuat dashboard');
    }

    return payload.data as KepalaDashboardData;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await fetchDashboard();
        if (cancelled) return;
        setData(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchDashboard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await fetchDashboard();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    try {
      const result = await fetchDashboard();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <div className="mb-lg flex flex-wrap justify-between items-end gap-md">
      <div className="flex flex-col gap-xs">
        <h2 className="font-headline-lg text-headline-lg text-primary">Dashboard Kepala BPS</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Ringkasan kinerja sistem pencocokan data berdasarkan data terkini.
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
  );

  if (loading) {
    return (
      <div className="space-y-lg">
        {header}
        <div className="flex flex-col items-center justify-center py-3xl gap-md">
          <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>
            progress_activity
          </span>
          <p className="text-on-surface-variant font-body-lg">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-lg">
        {header}
        <div className="bg-error-container border-l-4 border-error p-lg rounded-lg">
          <div className="flex items-start justify-between gap-md">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-error">error</span>
              <p className="text-on-error-container font-body-md">
                {error || 'Gagal memuat dashboard'}
              </p>
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

  const { verification, assignments, employees, datasets, monthlyActivity, recentActivities } = data;

  const maxMonthly = Math.max(...monthlyActivity.map((month) => month.total), 1);
  const activeEmployees = employees.rows
    .slice()
    .sort((a, b) => b.completed - a.completed || b.totalAssigned - a.totalAssigned)
    .slice(0, 5);

  return (
    <div className="space-y-lg">
      {header}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard
          label="Total Kandidat"
          value={formatNumber(verification.totalCandidates)}
          icon="fact_check"
          tone="text-secondary"
          subtext="Kandidat pencocokan tersimpan"
        />
        <StatCard
          label="MATCH"
          value={formatNumber(verification.matchCount)}
          icon="thumb_up"
          tone="text-primary"
          subtext="Hasil verifikasi cocok"
        />
        <StatCard
          label="NON-MATCH"
          value={formatNumber(verification.nonMatchCount)}
          icon="thumb_down"
          tone="text-error"
          subtext="Hasil verifikasi tidak cocok"
        />
        <StatCard
          label="Belum Diverifikasi"
          value={formatNumber(verification.unverified)}
          icon="schedule"
          tone="text-warning"
          subtext="Menunggu verifikasi petugas"
        />
        <StatCard
          label="Tingkat Verifikasi"
          value={`${verification.verificationRate}%`}
          icon="verified"
          tone="text-primary"
          subtext={`${formatNumber(verification.verified)} dari ${formatNumber(verification.totalCandidates)} kandidat`}
        />
        <StatCard
          label="Total Pegawai"
          value={formatNumber(employees.activeCount)}
          icon="groups"
          tone="text-secondary"
          subtext="Pegawai aktif"
        />
        <StatCard
          label="Total Dataset"
          value={formatNumber(datasets.total)}
          icon="database"
          tone="text-secondary"
          subtext={`${formatNumber(datasets.ready)} berstatus READY`}
        />
        <StatCard
          label="Total Record Dataset"
          value={formatNumber(datasets.totalRecords)}
          icon="table_rows"
          tone="text-secondary"
          subtext="Baris data tersimpan"
        />
      </div>

      {/* Verification summary */}
      <div className="bg-surface rounded-lg border border-outline p-lg">
        <div className="flex items-center justify-between mb-md">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Ringkasan Verifikasi</h3>
          <span className="font-label-md text-label-md text-on-surface-variant">
            Persentase MATCH dihitung dari kandidat terverifikasi
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          <div>
            <div className="flex items-center justify-between mb-sm">
              <span className="font-label-md text-label-md text-on-surface-variant">Progres Penyelesaian Penugasan</span>
              <span className="font-label-md text-label-md text-on-surface">{assignments.overallProgress}%</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${assignments.overallProgress}%` }}
              />
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant mt-xs">
              {formatNumber(assignments.completed)} dari {formatNumber(assignments.total)} penugasan telah selesai.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-sm">
              <span className="font-label-md text-label-md text-on-surface-variant">Persentase MATCH</span>
              <span className="font-label-md text-label-md text-on-surface">{verification.matchRate}%</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-3">
              <div
                className="bg-success h-3 rounded-full transition-all duration-300"
                style={{ width: `${verification.matchRate}%` }}
              />
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant mt-xs">
              {verification.verified === 0
                ? 'Belum ada data terverifikasi.'
                : `${formatNumber(verification.matchCount)} dari ${formatNumber(verification.verified)} kandidat terverifikasi.`}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly activity + data summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <div className="lg:col-span-2 bg-surface rounded-lg border border-outline p-lg">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-md">
            Tren Aktivitas Bulanan
          </h3>

          {monthlyActivity.length < 2 ? (
            <div className="py-3xl text-center">
              <span className="material-symbols-outlined text-outline" style={{ fontSize: '40px' }}>
                insights
              </span>
              <p className="text-on-surface-variant font-body-md mt-md">
                Belum cukup data historis untuk menampilkan tren bulanan.
              </p>
              <p className="text-on-surface-variant font-body-sm mt-xs">
                Tren akan muncul setelah aktivitas tercatat pada lebih dari satu bulan.
              </p>
            </div>
          ) : (
            <div className="space-y-md">
              {monthlyActivity.map((month) => (
                <div key={month.month}>
                  <div className="flex items-center justify-between mb-xs">
                    <span className="font-label-md text-label-md text-on-surface">{month.label}</span>
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      {formatNumber(month.total)} aktivitas
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2">
                    <div
                      className="bg-secondary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(month.total / maxMonthly) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="font-label-md text-label-md text-on-surface-variant pt-sm border-t border-outline-variant">
                Dihitung dari log audit sistem (tabel audit_logs).
              </p>
            </div>
          )}
        </div>

        <div className="bg-surface rounded-lg border border-outline p-lg">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-md">Ringkasan Data</h3>
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Total Dataset</span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">{formatNumber(datasets.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Dataset READY</span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">{formatNumber(datasets.ready)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Total Record</span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">{formatNumber(datasets.totalRecords)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Total Penugasan</span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">{formatNumber(assignments.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Menunggu Verifikasi</span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">{formatNumber(assignments.pending)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Sedang Dikerjakan</span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">{formatNumber(assignments.inProgress)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Selesai</span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">{formatNumber(assignments.completed)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Rata-rata Penyelesaian</span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">{employees.averageCompletionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-surface rounded-lg border border-outline p-lg">
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-md">Aktivitas Terbaru</h3>

        {recentActivities.length === 0 ? (
          <div className="py-3xl text-center">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '40px' }}>
              history
            </span>
            <p className="text-on-surface-variant font-body-md mt-md">Belum ada aktivitas tercatat.</p>
          </div>
        ) : (
          <div className="space-y-md">
            {recentActivities.map((activity: HistoryEntry) => {
              const meta = getAuditActionMeta(activity.action);
              return (
                <div key={activity.id} className="flex items-start gap-md pb-md border-b border-outline-variant last:border-b-0 last:pb-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-high">
                    <span className={`material-symbols-outlined ${meta.color}`} style={{ fontSize: '20px' }}>
                      {meta.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md text-on-surface font-semibold">{meta.label}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                      {describeAuditLog(activity.action, activity.metadata, activity.entityType, activity.entityId)}
                    </p>
                    <p className="font-label-md text-label-md text-on-surface-variant mt-xs">
                      {activity.userName ?? '-'} · {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Employee performance */}
      <div className="bg-surface rounded-lg border border-outline overflow-hidden">
        <div className="p-lg border-b border-outline">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Kinerja Pegawai</h3>
        </div>

        {activeEmployees.length === 0 ? (
          <div className="py-3xl text-center">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '40px' }}>
              person_off
            </span>
            <p className="text-on-surface-variant font-body-md mt-md">Belum ada pegawai terdaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead className="bg-surface-container-low border-b border-outline">
                <tr>
                  <th className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">Nama Pegawai</th>
                  <th className="text-center p-md font-label-lg text-label-lg text-on-surface-variant">Ditugaskan</th>
                  <th className="text-center p-md font-label-lg text-label-lg text-on-surface-variant">Selesai</th>
                  <th className="text-center p-md font-label-lg text-label-lg text-on-surface-variant">Menunggu Verifikasi</th>
                  <th className="text-center p-md font-label-lg text-label-lg text-on-surface-variant">Progres</th>
                  <th className="text-center p-md font-label-lg text-label-lg text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeEmployees.map((employee: EmployeeMonitoringProgress) => (
                  <tr key={employee.employeeId} className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
                    <td className="p-md">
                      <p className="font-body-md text-on-surface font-semibold">{employee.fullName}</p>
                      <p className="font-label-md text-label-md text-on-surface-variant">{employee.email}</p>
                    </td>
                    <td className="p-md text-center">
                      <span className="font-headline-sm text-on-surface">{formatNumber(employee.totalAssigned)}</span>
                    </td>
                    <td className="p-md text-center">
                      <span className="font-headline-sm text-primary">{formatNumber(employee.completed)}</span>
                    </td>
                    <td className="p-md text-center">
                      <span className="font-headline-sm text-warning">{formatNumber(employee.pending)}</span>
                    </td>
                    <td className="p-md text-center">
                      <span className="font-label-md text-label-md text-on-surface">{employee.completionRate}%</span>
                      <div className="w-full bg-surface-container-highest rounded-full h-2 mt-xs">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${employee.completionRate}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-md text-center">
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
        )}
      </div>

      {/* Info */}
      <div className="bg-surface-container rounded-lg border border-outline p-lg">
        <div className="flex items-start gap-md">
          <span className="material-symbols-outlined text-primary">info</span>
          <div>
            <h3 className="font-label-lg text-label-lg text-on-surface font-semibold mb-sm">
              Tentang Dashboard Kepala BPS
            </h3>
            <p className="text-on-surface-variant font-body-md">
              Seluruh angka, nama pegawai, dan aktivitas pada halaman ini diambil langsung dari basis data sistem
              (penugasan, verifikasi, dataset, dan log audit). Halaman ini bersifat hanya-baca.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
