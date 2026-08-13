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
        
        // Verify it's a superadmin
        if (data.user?.role !== 'ADMIN') {
          router.push('/login');
          return;
        }
        
        setUser(data.user);
        setLoading(false);
      } catch {
        setError('Terjadi kesalahan saat memuat data');
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <span className="material-symbols-outlined text-[40px] animate-spin inline-block">hourglass_empty</span>
          <p className="mt-md text-on-surface-variant">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-lg">
        <div className="text-center bg-surface border border-outline-variant rounded p-xl max-w-[400px]">
          <p className="text-on-error-container text-body-md">{error || 'Akses ditolak'}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout pageTitle="Dashboard Superadmin">
      {/* Breadcrumb */}
      <div className="mb-sm">
        <span className="text-on-surface-variant font-label-md text-sm">
          Sistem Pencocokan Data / <span className="text-primary font-semibold">Dashboard</span>
        </span>
      </div>

      {/* Page Header */}
      <div className="mb-xl flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-1">Dashboard Superadmin</h2>
          <p className="font-body-md text-on-surface-variant">Overview aktivitas pencocokan data dan metrik sistem.</p>
        </div>
        <div className="flex gap-sm">
          <button className="px-md py-sm bg-surface border border-outline-variant text-primary rounded-md font-label-md hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">download</span> Export Laporan
          </button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-md mb-xl">
        <div className="bg-surface p-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-sm text-on-surface-variant">
            <span className="font-label-md">Total Dataset</span>
            <span className="material-symbols-outlined text-secondary">database</span>
          </div>
          <div className="font-headline-lg text-primary">1,428</div>
          <div className="font-label-md text-on-surface-variant mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-success">arrow_upward</span>
            <span>+8.4% bln ini</span>
          </div>
        </div>

        <div className="bg-surface p-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-sm text-on-surface-variant">
            <span className="font-label-md">Proses Berjalan</span>
            <span className="material-symbols-outlined text-secondary">sync</span>
          </div>
          <div className="font-headline-lg text-primary">12</div>
          <div className="font-label-md text-on-surface-variant mt-1">Aktif saat ini</div>
        </div>

        <div className="bg-surface p-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-sm text-on-surface-variant">
            <span className="font-label-md">Kandidat Matching</span>
            <span className="material-symbols-outlined text-primary-container">fact_check</span>
          </div>
          <div className="font-headline-lg text-primary">24.8k</div>
          <div className="font-label-md text-on-surface-variant mt-1">Menunggu validasi</div>
        </div>

        <div className="bg-surface p-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-sm text-on-surface-variant">
            <span className="font-label-md">Anomali Data</span>
            <span className="material-symbols-outlined text-error">warning</span>
          </div>
          <div className="font-headline-lg text-error">156</div>
          <div className="font-label-md text-on-surface-variant mt-1">Perlu penanganan</div>
        </div>

        <div className="bg-primary text-on-primary p-md rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-sm">
            <span className="font-label-md">Target Bulanan</span>
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <div>
            <div className="font-headline-lg mb-1">82%</div>
            <div className="w-full bg-primary-fixed-dim/30 rounded-full h-1.5 mb-1">
              <div className="bg-secondary-fixed h-1.5 rounded-full" style={{ width: '82%' }}></div>
            </div>
            <div className="font-label-md opacity-80">1.2M baris diproses</div>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xl">
        {/* Activity Chart */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-lg lg:col-span-2">
          <h3 className="font-headline-sm text-primary mb-md">Aktivitas Matching (30 Hari)</h3>
          <div className="h-64 w-full flex items-end justify-between gap-2 pb-4 px-4">
            {[40, 60, 85, 45, 30, 70, 55, 90].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-secondary rounded-t-md transition-all hover:bg-primary"
                  style={{ height: `${height}%` }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-lg">
          <h3 className="font-headline-sm text-primary mb-md">Status Hasil (Overall)</h3>
          <div className="h-64 w-full flex flex-col items-center justify-center gap-md">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e0e0" strokeWidth="20" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#4CAF50" strokeWidth="20" strokeDasharray="163 251" strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#FFC107" strokeWidth="20" strokeDasharray="63 251" strokeDashoffset="-163" strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F44336" strokeWidth="20" strokeDasharray="25 251" strokeDashoffset="-226" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-headline-sm text-primary">85k</div>
                <div className="font-label-sm text-on-surface-variant text-[10px]">Total Data</div>
              </div>
            </div>
            <div className="flex flex-col gap-xs text-body-sm">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                <span className="text-on-surface-variant">Match (65%)</span>
              </div>
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 rounded-full bg-[#FFC107]"></div>
                <span className="text-on-surface-variant">Non-Match (25%)</span>
              </div>
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 rounded-full bg-[#F44336]"></div>
                <span className="text-on-surface-variant">Anomali (10%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden mb-xl">
        <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-headline-sm text-primary">Proses Terbaru</h3>
          <button className="text-secondary font-label-md hover:underline">Lihat Semua</button>
        </div>
        <div className="p-xl text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] opacity-30">inbox</span>
          <p className="text-body-md mt-sm">Belum ada proses pencocokan yang berjalan</p>
          <p className="text-body-sm mt-xs">Mulai dengan mengunggah dataset terlebih dahulu</p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
