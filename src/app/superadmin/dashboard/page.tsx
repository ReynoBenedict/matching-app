'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout';

interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  status: string;
}

// Synthetic sample data matching the Stitch reference exactly.
// These are illustrative placeholders — not live production statistics.
const SAMPLE_PROCESSES = [
  {
    id: 'PR-2024-089',
    datasetUtama: 'Sensus_Penduduk_2020',
    datasetPembanding: 'Dukcapil_Malang_2023',
    status: 'Running' as const,
    progress: 45,
  },
  {
    id: 'PR-2024-088',
    datasetUtama: 'Data_Kemiskinan_DTKS',
    datasetPembanding: 'Penerima_Bansos_Kota',
    status: 'Completed' as const,
    progress: 100,
  },
  {
    id: 'PR-2024-087',
    datasetUtama: 'Data_UMKM_Diskop',
    datasetPembanding: 'Pajak_Daerah_Bapenda',
    status: 'Failed' as const,
    progress: 12,
  },
];

const BAR_HEIGHTS = [40, 60, 85, 45, 30, 70, 55, 90];

function StatusBadge({ status }: { status: 'Running' | 'Completed' | 'Failed' }) {
  if (status === 'Running') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-fixed text-on-secondary-fixed">
        Running
      </span>
    );
  }
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-container-high text-on-surface">
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error-container text-on-error-container">
      Failed
    </span>
  );
}

function ProgressBar({ value, status }: { value: number; status: 'Running' | 'Completed' | 'Failed' }) {
  const barColor =
    status === 'Running'
      ? 'bg-secondary'
      : status === 'Completed'
      ? 'bg-primary-container'
      : 'bg-error';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-surface-container-highest rounded-full h-1.5">
        <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs">{value}%</span>
    </div>
  );
}

export default function SuperadminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const data = await response.json();
        if (data.user?.role !== 'ADMIN') {
          router.push('/login');
          return;
        }
        setUser(data.user);
      } catch {
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <span className="material-symbols-outlined text-[40px] inline-block" style={{ animation: 'spin 2s linear infinite' }}>
            hourglass_empty
          </span>
          <p className="mt-4 text-on-surface-variant">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="text-center bg-surface border border-outline-variant rounded p-8 max-w-[400px]">
          <p className="text-on-error-container text-sm">{error || 'Akses ditolak'}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout pageTitle="Dashboard Superadmin">

      {/* Breadcrumb */}
      <div className="mb-2">
        <span className="text-on-surface-variant text-label-md text-xs">
          Sistem Pencocokan Data /{' '}
          <span className="text-primary font-semibold">Dashboard</span>
        </span>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-1">
            Dashboard Superadmin
          </h2>
          <p className="font-body-md text-on-surface-variant">
            Overview aktivitas pencocokan data dan metrik sistem.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface border border-outline-variant text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-1 text-sm">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Laporan
          </button>
        </div>
      </div>

      {/* ── KPI Bento Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

        {/* Total Dataset */}
        <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2 text-on-surface-variant">
            <span className="font-label-md text-xs">Total Dataset</span>
            <span className="material-symbols-outlined text-secondary">database</span>
          </div>
          <div className="font-headline-lg text-headline-lg text-primary">1,428</div>
          <div className="font-label-md text-xs text-secondary mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
            +8.4% bln ini
          </div>
        </div>

        {/* Proses Berjalan */}
        <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2 text-on-surface-variant">
            <span className="font-label-md text-xs">Proses Berjalan</span>
            <span className="material-symbols-outlined text-secondary">sync</span>
          </div>
          <div className="font-headline-lg text-headline-lg text-primary">12</div>
          <div className="font-label-md text-xs text-on-surface-variant mt-1">Aktif saat ini</div>
        </div>

        {/* Kandidat Matching */}
        <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2 text-on-surface-variant">
            <span className="font-label-md text-xs">Kandidat Matching</span>
            <span className="material-symbols-outlined text-primary-container">fact_check</span>
          </div>
          <div className="font-headline-lg text-headline-lg text-primary">24.8k</div>
          <div className="font-label-md text-xs text-on-surface-variant mt-1">Menunggu validasi</div>
        </div>

        {/* Anomali Data */}
        <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2 text-on-surface-variant">
            <span className="font-label-md text-xs">Anomali Data</span>
            <span className="material-symbols-outlined text-error">warning</span>
          </div>
          <div className="font-headline-lg text-headline-lg text-error">156</div>
          <div className="font-label-md text-xs text-on-surface-variant mt-1">Perlu penanganan</div>
        </div>

        {/* Target Bulanan — filled primary card */}
        <div className="bg-primary text-on-primary p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-md text-xs">Target Bulanan</span>
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg mb-1">82%</div>
            <div className="w-full rounded-full h-1.5 mb-1" style={{ backgroundColor: 'rgba(169,199,255,0.3)' }}>
              <div className="bg-secondary-fixed h-1.5 rounded-full" style={{ width: '82%' }} />
            </div>
            <div className="font-label-md text-xs opacity-80">1.2M baris diproses</div>
          </div>
        </div>
      </div>

      {/* ── Charts Area ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Bar Chart */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-6 lg:col-span-2">
          <h3 className="font-headline-sm text-primary mb-4">Aktivitas Matching (30 Hari)</h3>
          <div className="h-64 w-full bg-surface-container-low rounded-lg border border-outline-variant/50 relative overflow-hidden flex items-end px-4 pb-4 pt-6 gap-2 justify-between">
            {BAR_HEIGHTS.map((height, idx) => {
              const isPeak = height >= 80;
              return (
                <div
                  key={idx}
                  className={`w-full rounded-t-sm transition-colors relative group ${
                    isPeak
                      ? 'bg-primary-container hover:bg-primary'
                      : 'bg-secondary-container hover:bg-secondary'
                  }`}
                  style={{ height: `${height}%` }}
                >
                  <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                    {height}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut Chart — CSS conic-gradient matching Stitch */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-6">
          <h3 className="font-headline-sm text-primary mb-4">Status Hasil (Overall)</h3>
          <div className="h-64 w-full flex flex-col items-center justify-center gap-4">
            {/* Donut via conic-gradient */}
            <div className="relative flex items-center justify-center">
              <div
                className="w-48 h-48 rounded-full"
                style={{
                  background: 'conic-gradient(#006493 0% 65%, #c3c6d2 65% 90%, #ba1a1a 90% 100%)',
                }}
              />
              {/* Inner cutout */}
              <div className="absolute w-32 h-32 bg-surface rounded-full flex flex-col items-center justify-center">
                <span className="font-headline-sm text-primary">85k</span>
                <span className="font-label-md text-xs text-on-surface-variant">Total Data</span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-1 font-label-md text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-secondary" />
                <span>Match (65%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-outline-variant" />
                <span>Non-Match (25%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-error" />
                <span>Anomali (10%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Processes Table ────────────────────────────────── */}
      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-headline-sm text-primary">Proses Terbaru</h3>
          <button className="text-secondary font-label-md text-xs hover:underline">
            Lihat Semua
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-label-md text-xs text-on-surface-variant">
                <th className="px-4 py-3">ID Proses</th>
                <th className="px-4 py-3">Dataset Utama</th>
                <th className="px-4 py-3">Dataset Pembanding</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-on-surface text-sm">
              {SAMPLE_PROCESSES.map((proc) => (
                <tr
                  key={proc.id}
                  className="border-b border-outline-variant/50 hover:bg-surface-container-highest/20 transition-colors"
                >
                  <td className="px-4 py-3 font-data-tabular">{proc.id}</td>
                  <td className="px-4 py-3 font-data-tabular">{proc.datasetUtama}</td>
                  <td className="px-4 py-3 font-data-tabular">{proc.datasetPembanding}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={proc.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar value={proc.progress} status={proc.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled
                      title="Detail tersedia pada fase berikutnya"
                      className="text-primary hover:text-secondary px-2 py-1 rounded hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </AuthenticatedLayout>
  );
}
