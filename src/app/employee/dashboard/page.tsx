'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployeeLayout } from '@/components/layouts/EmployeeLayout';

interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  status: string;
}

interface AssignmentSummary {
  total: number;
  pending: number;
  completed: number;
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [assignmentSummary, setAssignmentSummary] = useState<AssignmentSummary>({
    total: 0,
    pending: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
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

        // Fetch assignment summary for Employee
        const assignResponse = await fetch('/api/assignments/my');
        if (assignResponse.ok) {
          const assignData = await assignResponse.json();
          const assignments = assignData.data || [];
          
          const summary = {
            total: assignments.length,
            pending: assignments.filter((a: any) => a.status === 'PENDING').length,
            completed: assignments.filter((a: any) => a.status === 'COMPLETED').length,
          };
          setAssignmentSummary(summary);
        }
      } catch (err) {
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
    <EmployeeLayout pageTitle="Dashboard Petugas Verifikasi">
      {/* Breadcrumb */}
      <div className="mb-2">
        <span className="text-on-surface-variant text-label-md text-xs">
          Sistem Pencocokan Data /{' '}
          <span className="text-primary font-semibold">Dashboard</span>
        </span>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-2">
          Dashboard Petugas Verifikasi
        </h2>
        <p className="font-body-md text-on-surface-variant">
          Kelola tugas verifikasi data Anda
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Assignments */}
        <div className="bg-surface p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4 text-on-surface-variant">
            <span className="font-label-md text-sm">Total Penugasan</span>
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '24px' }}>
              assignment
            </span>
          </div>
          <div className="font-headline-lg text-headline-lg text-primary mb-1">
            {assignmentSummary.total}
          </div>
          <div className="font-label-md text-xs text-on-surface-variant">
            Penugasan yang ditugaskan kepada Anda
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="bg-surface p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4 text-on-surface-variant">
            <span className="font-label-md text-sm">Menunggu Verifikasi</span>
            <span className="material-symbols-outlined text-warning" style={{ fontSize: '24px' }}>
              schedule
            </span>
          </div>
          <div className="font-headline-lg text-headline-lg text-warning mb-1">
            {assignmentSummary.pending}
          </div>
          <div className="font-label-md text-xs text-on-surface-variant">
            Penugasan yang perlu diverifikasi
          </div>
        </div>

        {/* Completed Assignments */}
        <div className="bg-surface p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4 text-on-surface-variant">
            <span className="font-label-md text-sm">Sudah Diverifikasi</span>
            <span className="material-symbols-outlined text-success" style={{ fontSize: '24px' }}>
              check_circle
            </span>
          </div>
          <div className="font-headline-lg text-headline-lg text-success mb-1">
            {assignmentSummary.completed}
          </div>
          <div className="font-label-md text-xs text-on-surface-variant">
            Penugasan yang telah selesai
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-6 mb-8">
        <h3 className="font-headline-sm text-primary mb-4">Progres Verifikasi</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-label-md text-sm text-on-surface-variant">Penugasan Selesai</span>
              <span className="font-headline-md text-md text-primary">
                {assignmentSummary.completed} dari {assignmentSummary.total}
              </span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{
                  width: `${assignmentSummary.total === 0 ? 0 : Math.round((assignmentSummary.completed / assignmentSummary.total) * 100)}%`,
                }}
              />
            </div>
            <p className="font-label-md text-xs text-on-surface-variant mt-2">
              {assignmentSummary.total === 0 ? '0%' : Math.round((assignmentSummary.completed / assignmentSummary.total) * 100)}% selesai
            </p>
          </div>
        </div>
      </div>

      {/* Assignment Entry Section */}
      <div className="bg-primary text-on-primary p-8 rounded-xl shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-headline-sm text-headline-sm mb-2">Penugasan Saya</h3>
            <p className="font-body-md opacity-90 mb-6">
              {assignmentSummary.pending > 0
                ? `Anda memiliki ${assignmentSummary.pending} penugasan yang menunggu verifikasi. Buka daftar penugasan untuk memulai.`
                : 'Tidak ada penugasan yang menunggu. Periksa kembali nanti.'}
            </p>
            <button
              onClick={() => router.push('/employee/assignments')}
              className="px-6 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-label-lg hover:bg-secondary hover:text-on-primary transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                arrow_forward
              </span>
              Buka Penugasan Saya
            </button>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-[60px] mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                fact_check
              </span>
              <p className="font-label-md text-sm opacity-80">
                Verifikasi data dengan cermat dan teliti
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information Card */}
      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-6">
        <h3 className="font-headline-sm text-primary mb-4">Informasi Akun Anda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="font-label-md text-xs text-on-surface-variant mb-1">Nama Lengkap</p>
            <p className="font-body-md text-on-surface">{user.fullName}</p>
          </div>
          <div>
            <p className="font-label-md text-xs text-on-surface-variant mb-1">Email</p>
            <p className="font-body-md text-on-surface">{user.email}</p>
          </div>
          <div>
            <p className="font-label-md text-xs text-on-surface-variant mb-1">Username</p>
            <p className="font-body-md text-on-surface">{user.username}</p>
          </div>
          <div>
            <p className="font-label-md text-xs text-on-surface-variant mb-1">Status</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-container text-on-success-container">
              {user.status === 'ACTIVE' ? 'Aktif' : user.status}
            </span>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
