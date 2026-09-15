/**
 * /superadmin/dashboard
 * Fully database-backed Superadmin dashboard.
 * Every KPI, chart series and activity row is fetched from
 * /api/superadmin/dashboard (superadmin-only). No hardcoded statistics.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import { describeAuditLog, getAuditActionMeta } from '@/lib/constants/audit-actions';
import type { SuperadminDashboardData } from '@/lib/services/superadmin-dashboard';
import type { HistoryEntry } from '@/lib/services/history';

const AUTH_ERROR = 'UNAUTHORIZED';

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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

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
        <span className={`material-symbols-outlined ${tone || 'text-secondary'}`}>{icon}</span>
      </div>
      <div className="font-headline-lg text-headline-lg text-primary">{value}</div>
      {subtext && (
        <div className="font-label-md text-xs text-on-surface-variant mt-1">{subtext}</div>
      )}
    </div>
  );
}

export default function SuperadminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<SuperadminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pure fetcher — performs no state updates, so it is safe to await anywhere.
  const fetchDashboard = useCallback(async (): Promise<SuperadminDashboardData> => {
    const response = await fetch('/api/superadmin/dashboard');
    if (response.status === 401 || response.status === 403) {
      throw new Error(AUTH_ERROR);
    }
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Gagal memuat dashboard');
    }
    return payload.data as SuperadminDashboardData;
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
        if (err instanceof Error && err.message === AUTH_ERROR) {
          router.push('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Gagal memuat dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchDashboard, router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await fetchDashboard();
      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.message === AUTH_ERROR) {
        router.push('/login');
        return;
      }
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
      if (err instanceof Error && err.message === AUTH_ERROR) {
        router.push('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-primary mb-1">
          Dashboard Superadmin
        </h2>
        <p className="font-body-md text-on-surface-variant">
          Ringkasan data tercatat: dataset, pengguna, penugasan, dan aktivitas sistem.
        </p>
      </div>
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="px-4 py-2 bg-surface border border-outline-variant text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-1 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>
          refresh
        </span>
        {refreshing ? 'Memperbarui...' : 'Perbarui'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <SuperadminLayout pageTitle="Dashboard Superadmin">
        <div className="mb-2">
          <span className="text-on-surface-variant text-label-md text-xs">
            Sistem Pencocokan Data /{' '}
            <span className="text-primary font-semibold">Dashboard</span>
          </span>
        </div>
        {header}
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>
            progress_activity
          </span>
          <p className="text-on-surface-variant font-body-lg">Memuat data dashboard...</p>
        </div>
      </SuperadminLayout>
    );
  }

  if (error || !data) {
    return (
      <SuperadminLayout pageTitle="Dashboard Superadmin">
        <div className="mb-2">
          <span className="text-on-surface-variant text-label-md text-xs">
            Sistem Pencocokan Data /{' '}
            <span className="text-primary font-semibold">Dashboard</span>
          </span>
        </div>
        {header}
        <div className="bg-error-container border-l-4 border-error p-6 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-error">error</span>
              <p className="text-on-error-container font-body-md">{error || 'Gagal memuat dashboard'}</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-error text-on-error font-label-md rounded-lg hover:opacity-90 transition-opacity"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </SuperadminLayout>
    );
  }

  const { datasets, users, assignments, verification, monthlyActivity, recentActivities } = data;

  const maxMonthly = Math.max(...monthlyActivity.map((month) => month.total), 1);

  const totalCandidates = verification.totalCandidates;
  const hasCandidates = totalCandidates > 0;
  const matchPercent = hasCandidates ? round2((verification.matchCount / totalCandidates) * 100) : 0;
  const nonMatchPercent = hasCandidates ? round2((verification.nonMatchCount / totalCandidates) * 100) : 0;
  const unverifiedPercent = hasCandidates ? round2(100 - matchPercent - nonMatchPercent) : 0;
  const donutGradient =
    `conic-gradient(` +
    `#006493 0% ${matchPercent}%, ` +
    `#ba1a1a ${matchPercent}% ${matchPercent + nonMatchPercent}%, ` +
    `#c3c6d2 ${matchPercent + nonMatchPercent}% 100%)`;

  return (
    <SuperadminLayout pageTitle="Dashboard Superadmin">

      {/* Breadcrumb */}
      <div className="mb-2">
        <span className="text-on-surface-variant text-label-md text-xs">
          Sistem Pencocokan Data /{' '}
          <span className="text-primary font-semibold">Dashboard</span>
        </span>
      </div>

      {header}

      {/* ── KPI Bento Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

        {/* Total Dataset */}
        <StatCard
          label="Total Dataset"
          value={formatNumber(datasets.total)}
          icon="database"
          tone="text-secondary"
          subtext={`${formatNumber(datasets.ready)} berstatus READY`}
        />

        {/* Total Record */}
        <StatCard
          label="Total Record"
          value={formatNumber(datasets.totalRecords)}
          icon="table_rows"
          tone="text-secondary"
          subtext="Baris data tersimpan"
        />

        {/* Kandidat Ditugaskan */}
        <StatCard
          label="Kandidat Ditugaskan"
          value={formatNumber(assignments.total)}
          icon="fact_check"
          tone="text-primary-container"
          subtext={`${formatNumber(assignments.pending)} menunggu verifikasi`}
        />

        {/* Pegawai Aktif */}
        <StatCard
          label="Pegawai Aktif"
          value={formatNumber(users.activeEmployees)}
          icon="groups"
          tone="text-secondary"
          subtext={`${formatNumber(users.total)} pengguna terdaftar`}
        />

        {/* Tingkat Match — filled primary card */}
        <div className="bg-primary text-on-primary p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-md text-xs">Tingkat Match</span>
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg mb-1">
              {verification.verified === 0 ? '—' : `${verification.matchRate}%`}
            </div>
            <div className="w-full rounded-full h-1.5 mb-1" style={{ backgroundColor: 'rgba(169,199,255,0.3)' }}>
              <div
                className="bg-secondary-fixed h-1.5 rounded-full"
                style={{ width: `${verification.verified === 0 ? 0 : verification.matchRate}%` }}
              />
            </div>
            <div className="font-label-md text-xs opacity-80">
              {verification.verified === 0
                ? 'Belum ada data terverifikasi'
                : `${formatNumber(verification.matchCount)} dari ${formatNumber(verification.verified)} terverifikasi`}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Area ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Bar Chart — real audit activity per month */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-6 lg:col-span-2">
          <h3 className="font-headline-sm text-primary mb-4">Aktivitas Sistem (per Bulan)</h3>

          {monthlyActivity.length === 0 ? (
            <div className="h-64 w-full bg-surface-container-low rounded-lg border border-outline-variant/50 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-outline" style={{ fontSize: '40px' }}>
                insights
              </span>
              <p className="text-on-surface-variant font-body-md mt-2">Belum ada data historis.</p>
              <p className="text-on-surface-variant font-body-sm mt-1">
                Grafik akan terisi setelah aktivitas tercatat pada log audit.
              </p>
            </div>
          ) : (
            <>
              <div className="h-64 w-full bg-surface-container-low rounded-lg border border-outline-variant/50 flex items-end px-4 pb-4 pt-6 gap-2 justify-between overflow-x-auto">
                {monthlyActivity.map((month) => (
                  <div
                    key={month.month}
                    className="flex-1 min-w-[40px] h-full flex items-end"
                  >
                    <div
                      title={`${month.label}: ${formatNumber(month.total)} aktivitas`}
                      className="w-full rounded-t-sm bg-secondary-container hover:bg-secondary transition-colors relative group"
                      style={{ height: `${(month.total / maxMonthly) * 100}%` }}
                    >
                      <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                        {formatNumber(month.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                {monthlyActivity.map((month) => (
                  <div key={month.month} className="flex-1 min-w-[40px] text-center text-[10px] text-on-surface-variant truncate">
                    {month.label}
                  </div>
                ))}
              </div>
              <p className="font-label-md text-xs text-on-surface-variant mt-3">
                Dihitung dari log audit sistem (tabel audit_logs).
              </p>
            </>
          )}
        </div>

        {/* Donut Chart — real verification status */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-6">
          <h3 className="font-headline-sm text-primary mb-4">Status Verifikasi Kandidat</h3>

          {!hasCandidates ? (
            <div className="h-64 w-full flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-outline" style={{ fontSize: '40px' }}>
                donut_large
              </span>
              <p className="text-on-surface-variant font-body-md">Belum ada kandidat tersimpan.</p>
              <p className="text-on-surface-variant font-body-sm text-center px-4">
                Diagram terisi setelah kandidat pencocokan ditugaskan dan diverifikasi.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full flex flex-col items-center justify-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="w-48 h-48 rounded-full" style={{ background: donutGradient }} />
                <div className="absolute w-32 h-32 bg-surface rounded-full flex flex-col items-center justify-center">
                  <span className="font-headline-sm text-primary">{formatNumber(totalCandidates)}</span>
                  <span className="font-label-md text-xs text-on-surface-variant">Total Kandidat</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 font-label-md text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-secondary" />
                  <span>Match ({formatNumber(verification.matchCount)} · {Math.round(matchPercent)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-error" />
                  <span>Non-Match ({formatNumber(verification.nonMatchCount)} · {Math.round(nonMatchPercent)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-outline-variant" />
                  <span>Belum Diverifikasi ({formatNumber(verification.unverified)} · {Math.round(unverifiedPercent)}%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Activity ───────────────────────────────────────── */}
      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-headline-sm text-primary">Aktivitas Terbaru</h3>
          <span className="text-on-surface-variant font-label-md text-xs">
            Sumber: log audit (tabel audit_logs)
          </span>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '40px' }}>
              history
            </span>
            <p className="text-on-surface-variant font-body-md mt-2">Belum ada aktivitas tercatat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-label-md text-xs text-on-surface-variant">
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Aktivitas</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Pengguna</th>
                </tr>
              </thead>
              <tbody className="text-on-surface text-sm">
                {recentActivities.map((activity: HistoryEntry) => {
                  const meta = getAuditActionMeta(activity.action);
                  return (
                    <tr
                      key={activity.id}
                      className="border-b border-outline-variant/50 hover:bg-surface-container-highest/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-data-tabular whitespace-nowrap">
                        {formatDateTime(activity.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <span className={`material-symbols-outlined ${meta.color}`} style={{ fontSize: '16px' }}>
                            {meta.icon}
                          </span>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {describeAuditLog(activity.action, activity.metadata, activity.entityType, activity.entityId)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{activity.userName ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Info ──────────────────────────────────────────────────── */}
      <div className="bg-surface-container rounded-lg border border-outline p-6">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-primary">info</span>
          <div>
            <h3 className="font-label-lg text-label-lg text-on-surface font-semibold mb-2">
              Tentang Dashboard Superadmin
            </h3>
            <p className="text-on-surface-variant font-body-md">
              Seluruh angka dan aktivitas pada halaman ini diambil langsung dari basis data
              (dataset, record, pengguna, penugasan, verifikasi, dan log audit), sehingga selalu
              konsisten dengan halaman Monitoring Progres, Hasil Matching, Riwayat Proses,
              Penugasan, dan Manajemen Dataset.
            </p>
            <p className="text-on-surface-variant font-body-md mt-2">
              Riwayat proses pencocokan belum dipersistenkan sebagai tabel tersendiri — pencocokan
              berjalan sebagai job di memori. Karena itu halaman ini tidak menampilkan kartu
              &quot;proses berjalan&quot; maupun riwayat proses historis; aktivitas yang benar-benar
              tercatat ditampilkan melalui log audit.
            </p>
          </div>
        </div>
      </div>

    </SuperadminLayout>
  );
}
