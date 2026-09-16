'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmployeeLayout } from '@/components/layouts/EmployeeLayout';
import { formatPercent, scoreBadgeClass } from '@/components/assignments/score';

interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  status: string;
}

interface Assignment {
  id: number;
  recordAId: number;
  recordBId: number;
  similarityScore: string;
  status: string;
  verificationResult: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

function toScore(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>
        progress_activity
      </span>
      <p className="font-body-lg text-on-surface-variant">Memuat data dashboard...</p>
    </div>
  );
}

function StatCard({ label, value, icon, tone = 'text-secondary', valueTone = 'text-primary', subtext }: {
  label: string;
  value: number | string;
  icon: string;
  tone?: string;
  valueTone?: string;
  subtext?: string;
}) {
  return (
    <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2 text-on-surface-variant">
        <span className="font-label-md text-xs uppercase tracking-wide">{label}</span>
        <span className={`material-symbols-outlined ${tone}`} style={{ fontSize: '20px' }}>
          {icon}
        </span>
      </div>
      <div className={`font-headline-lg text-headline-lg ${valueTone}`}>{value}</div>
      {subtext && (
        <div className="font-label-md text-xs text-on-surface-variant mt-1">{subtext}</div>
      )}
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        // Fetch current user
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
          router.push('/login');
          return;
        }
        const userData = await userResponse.json();
        const userRole = userData.user?.role;

        // Enforce Employee-only access
        if (userRole !== 'EMPLOYEE') {
          // Redirect non-employees away from employee dashboard
          if (userRole === 'ADMIN') {
            router.push('/superadmin/dashboard');
          } else {
            router.push('/dashboard');
          }
          return;
        }

        setUser(userData.user);

        // Fetch assignments for Employee
        const assignResponse = await fetch('/api/assignments/my');
        if (assignResponse.ok) {
          const assignData = await assignResponse.json();
          setAssignments(assignData.data || []);
        }
      } catch {
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, [fetchDashboard]);

  const breadcrumb = (
    <div className="mb-2">
      <span className="text-on-surface-variant text-label-md text-xs">
        Sistem Pencocokan Data /{' '}
        <span className="text-primary font-semibold">Dashboard</span>
      </span>
    </div>
  );

  if (loading) {
    return (
      <EmployeeLayout pageTitle="Dashboard Employee">
        {breadcrumb}
        <div className="mb-8">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-1">Dashboard Employee</h2>
          <p className="font-body-md text-on-surface-variant">Ringkasan penugasan verifikasi Anda.</p>
        </div>
        <PageLoader />
      </EmployeeLayout>
    );
  }

  if (error || !user) {
    return (
      <EmployeeLayout pageTitle="Dashboard Employee">
        {breadcrumb}
        <div className="mb-8">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-1">Dashboard Employee</h2>
          <p className="font-body-md text-on-surface-variant">Ringkasan penugasan verifikasi Anda.</p>
        </div>
        <div className="bg-error-container border-l-4 border-error p-6 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-error">error</span>
              <p className="text-on-error-container font-body-md">{error || 'Akses ditolak'}</p>
            </div>
            <button
              onClick={() => fetchDashboard()}
              className="px-4 py-2 bg-error text-on-error font-label-md rounded-lg hover:opacity-90 transition-opacity"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  const completedAssignments = assignments.filter((item) => item.status === 'COMPLETED');
  const summary = {
    total: assignments.length,
    completed: completedAssignments.length,
    pending: assignments.length - completedAssignments.length,
    matchCount: completedAssignments.filter((item) => item.verificationResult === 'MATCH').length,
    nonMatchCount: completedAssignments.filter((item) => item.verificationResult === 'NON_MATCH').length,
    completionRate:
      assignments.length === 0 ? 0 : Math.round((completedAssignments.length / assignments.length) * 100),
  };

  // Work queue: the longest-waiting assignments first.
  const pendingAssignments = assignments
    .filter((item) => item.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const pendingPreview = pendingAssignments.slice(0, 3);

  return (
    <EmployeeLayout pageTitle="Dashboard Employee">

      {breadcrumb}

      {/* Page header */}
      <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-1">
            Selamat Datang, {user.fullName}
          </h2>
          <p className="font-body-md text-on-surface-variant">
            Ringkasan penugasan verifikasi data yang ditugaskan kepada Anda.
          </p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="px-4 py-2 bg-surface border border-outline-variant text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-1 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>
            refresh
          </span>
          {refreshing ? 'Memperbarui...' : 'Perbarui'}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Penugasan"
          value={summary.total}
          icon="assignment"
          tone="text-secondary"
          subtext="Seluruh penugasan untuk Anda"
        />
        <StatCard
          label="Menunggu Verifikasi"
          value={summary.pending}
          icon="schedule"
          tone="text-warning"
          valueTone="text-warning"
          subtext="Belum Anda verifikasi"
        />
        <StatCard
          label="Sudah Diverifikasi"
          value={summary.completed}
          icon="check_circle"
          tone="text-success"
          valueTone="text-success"
          subtext="Penugasan selesai"
        />

        {/* Tingkat penyelesaian — filled primary card */}
        <div className="bg-primary text-on-primary p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-md text-xs uppercase tracking-wide">Tingkat Penyelesaian</span>
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg mb-1">{summary.completionRate}%</div>
            <div className="w-full rounded-full h-1.5 mb-1" style={{ backgroundColor: 'rgba(169,199,255,0.3)' }}>
              <div
                className="bg-secondary-fixed h-1.5 rounded-full"
                style={{ width: `${summary.completionRate}%` }}
              />
            </div>
            <div className="font-label-md text-xs opacity-80">
              {summary.completed} dari {summary.total} penugasan selesai
            </div>
          </div>
        </div>
      </div>

      {/* Pending work queue */}
      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-outline-variant flex flex-wrap justify-between items-center gap-3 bg-surface-container-lowest">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-primary">Menunggu Verifikasi</h3>
            <p className="font-label-md text-xs text-on-surface-variant mt-1">
              {summary.pending === 0
                ? 'Tidak ada penugasan yang menunggu verifikasi.'
                : `${summary.pending} penugasan perlu diverifikasi.`}
            </p>
          </div>
          <button
            onClick={() => router.push('/employee/assignments')}
            className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg font-label-md hover:bg-secondary hover:text-on-primary transition-colors"
          >
            Buka Penugasan Saya
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {pendingPreview.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <span
              className="material-symbols-outlined text-success"
              style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}
            >
              task_alt
            </span>
            <p className="font-body-md text-on-surface mt-2">
              {summary.total === 0
                ? 'Anda belum memiliki penugasan verifikasi.'
                : 'Semua penugasan Anda sudah selesai diverifikasi.'}
            </p>
            <p className="font-body-sm text-on-surface-variant mt-1">
              Penugasan baru akan ditampilkan di sini.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between px-6 py-2 bg-surface-container-low border-b border-outline-variant">
              <span className="font-label-md text-xs text-on-surface-variant">
                Diurutkan dari yang paling lama menunggu
              </span>
              <span className="font-label-md text-xs text-on-surface-variant">
                Menampilkan {pendingPreview.length} dari {summary.pending}
              </span>
            </div>
            <ul>
              {pendingPreview.map((assignment) => (
                <li key={assignment.id} className="border-b border-outline-variant last:border-b-0">
                  <Link
                    href={`/employee/assignments/${assignment.id}`}
                    className="w-full text-left px-6 py-4 hover:bg-surface-container-low transition-colors flex items-center justify-between gap-4"
                  >
                    <span className="flex items-center gap-4 min-w-0">
                      <span className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-warning" style={{ fontSize: '20px' }}>
                          fact_check
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block font-body-md font-semibold text-on-surface">
                          Penugasan #{assignment.id}
                        </span>
                        <span className="block font-label-md text-xs text-on-surface-variant mt-1 truncate">
                          Record A {assignment.recordAId} · Record B {assignment.recordBId} · Dibuat{' '}
                          {formatDate(assignment.createdAt)}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`px-2 py-1 rounded font-label-md ${scoreBadgeClass(
                          toScore(assignment.similarityScore)
                        )}`}
                      >
                        {formatPercent(toScore(assignment.similarityScore))}
                      </span>
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
                        arrow_forward
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Progress + account */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Progress */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-6 lg:col-span-2">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-4">Progres Verifikasi</h3>

          <div className="flex justify-between mb-2">
            <span className="font-body-md text-on-surface-variant">Penugasan selesai</span>
            <span className="font-headline-md text-headline-md text-primary">
              {summary.completed} dari {summary.total}
            </span>
          </div>
          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${summary.completionRate}%` }}
            />
          </div>
          <p className="font-label-md text-xs text-on-surface-variant mt-2">
            {summary.total === 0
              ? 'Belum ada penugasan untuk dihitung.'
              : `${summary.completionRate}% dari seluruh penugasan telah diverifikasi.`}
          </p>

          <div className="mt-6 pt-6 border-t border-outline-variant grid grid-cols-2 gap-4">
            <div>
              <p className="font-label-md text-xs text-on-surface-variant mb-1">Hasil MATCH</p>
              <p className="font-headline-md text-headline-md text-success">{summary.matchCount}</p>
              <p className="font-label-md text-xs text-on-surface-variant mt-1">
                Dinyatakan data yang sama
              </p>
            </div>
            <div>
              <p className="font-label-md text-xs text-on-surface-variant mb-1">Hasil NON-MATCH</p>
              <p className="font-headline-md text-headline-md text-error">{summary.nonMatchCount}</p>
              <p className="font-label-md text-xs text-on-surface-variant mt-1">
                Dinyatakan data berbeda
              </p>
            </div>
          </div>
        </div>

        {/* Account information */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-6">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-4">Informasi Akun</h3>
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-label-md text-xs text-on-surface-variant mb-1">Nama Lengkap</p>
              <p className="font-body-md text-on-surface">{user.fullName}</p>
            </div>
            <div>
              <p className="font-label-md text-xs text-on-surface-variant mb-1">Email</p>
              <p className="font-body-md text-on-surface break-all">{user.email}</p>
            </div>
            <div>
              <p className="font-label-md text-xs text-on-surface-variant mb-1">Username</p>
              <p className="font-body-md text-on-surface">{user.username}</p>
            </div>
            <div>
              <p className="font-label-md text-xs text-on-surface-variant mb-1">Status</p>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-label-md ${
                  user.status === 'ACTIVE'
                    ? 'bg-success-container text-on-success-container'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {user.status === 'ACTIVE' ? 'Aktif' : user.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
