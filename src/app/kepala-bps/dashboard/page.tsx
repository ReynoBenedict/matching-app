'use client';

import { useState, useEffect } from 'react';
import { mockExecutiveSummary } from '@/lib/mock/phase6';
import type { ExecutiveKPI, MonthlyStatistic, EmployeeProgress, HistoryRecord } from '@/types/phase6';

export default function KepalaExecutiveDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(mockExecutiveSummary);

  useEffect(() => {
    // Simulate API call with 500ms loading timeout
    const loadTimer = setTimeout(() => {
      setSummary(mockExecutiveSummary);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(loadTimer);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <span
            className="material-symbols-outlined text-[40px] inline-block text-primary"
            style={{ animation: 'spin 2s linear infinite' }}
          >
            hourglass_empty
          </span>
          <p className="mt-4 text-on-surface-variant">Memuat dashboard eksekutif...</p>
        </div>
      </div>
    );
  }

  // Helper function to get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      case 'stable':
      default:
        return 'trending_flat';
    }
  };

  // Helper function to get trend color
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      case 'stable':
      default:
        return 'text-outline';
    }
  };

  // Helper function to get activity icon
  const getActivityIcon = (action: string): string => {
    switch (action) {
      case 'MATCHING_START':
        return 'play_circle';
      case 'MATCHING_COMPLETE':
        return 'check_circle';
      case 'MATCHING_FAIL':
        return 'error';
      case 'ASSIGNMENT_CREATE':
        return 'assignment';
      case 'ASSIGNMENT_COMPLETE':
        return 'task_alt';
      case 'USER_LOGIN':
        return 'login';
      case 'USER_LOGOUT':
        return 'logout';
      case 'DATASET_UPLOAD':
        return 'cloud_upload';
      case 'VERIFICATION_SUBMIT':
        return 'verified_user';
      default:
        return 'event';
    }
  };

  // Helper function to calculate total datasets
  const totalDatasets = summary.kpis.find(kpi => kpi.id === 'kpi-6')?.value || 0;

  // Helper function to calculate average match rate
  const averageMatchRate =
    summary.monthlyTrends.reduce((sum, month) => sum + month.matchRate, 0) / summary.monthlyTrends.length;

  // Helper function to calculate remaining verification
  const totalRecords = summary.kpis.find(kpi => kpi.id === 'kpi-7')?.value || 0;
  const verificationRate = summary.kpis.find(kpi => kpi.id === 'kpi-3')?.value || 0;
  const verifiedCount = Math.round((totalRecords * verificationRate) / 100);
  const remainingVerification = totalRecords - verifiedCount;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-on-surface">Dashboard Eksekutif</h1>
          <p className="mt-2 text-on-surface-variant">Ringkasan kinerja sistem pencocokan data</p>
        </div>

        {/* KPI Cards Grid */}
        <div className={`grid gap-4 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4`}>
          {summary.kpis.map((kpi: ExecutiveKPI) => (
            <div
              key={kpi.id}
              className={`rounded-lg border border-outline bg-surface-container p-6 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-on-surface-variant">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-bold text-on-surface">
                    {kpi.value.toLocaleString('id-ID')}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">{kpi.unit}</p>
                </div>
                <span className={`material-symbols-outlined text-2xl ${getTrendColor(kpi.trend)}`}>
                  {getTrendIcon(kpi.trend)}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`inline-block text-sm font-semibold ${
                    kpi.trend === 'up'
                      ? 'text-success'
                      : kpi.trend === 'down'
                        ? 'text-error'
                        : 'text-outline'
                  }`}
                >
                  {kpi.change > 0 ? '+' : ''}
                  {kpi.change}%
                </span>
                <span className="text-xs text-on-surface-variant">{kpi.period}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Trends and Quick Stats */}
        <div className="grid gap-8 mb-8 grid-cols-1 lg:grid-cols-3">
          {/* Monthly Trends Table */}
          <div className={`lg:col-span-2 rounded-lg border border-outline bg-surface-container p-6 shadow-sm`}>
            <h2 className="mb-6 text-lg font-semibold text-on-surface">Tren Bulanan</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline">
                    <th className="px-4 py-3 text-left font-semibold text-on-surface">Bulan</th>
                    <th className="px-4 py-3 text-right font-semibold text-on-surface">Total Dataset</th>
                    <th className="px-4 py-3 text-right font-semibold text-on-surface">Total Match</th>
                    <th className="px-4 py-3 text-right font-semibold text-on-surface">Match Rate</th>
                    <th className="px-4 py-3 text-right font-semibold text-on-surface">Terverifikasi</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.monthlyTrends.map((month: MonthlyStatistic, index: number) => (
                    <tr
                      key={index}
                      className="border-b border-outline last:border-b-0 hover:bg-surface-dim transition-colors"
                    >
                      <td className="px-4 py-3 text-on-surface">
                        {month.month} {month.year}
                      </td>
                      <td className="px-4 py-3 text-right text-on-surface">
                        {month.totalDatasets}
                      </td>
                      <td className="px-4 py-3 text-right text-on-surface">
                        {month.totalMatched.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                            month.matchRate >= 70
                              ? 'bg-success/20 text-success'
                              : 'bg-warning/20 text-warning'
                          }`}
                        >
                          {month.matchRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-on-surface">
                        {month.totalVerified.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-4">
            {/* Total Proses */}
            <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
              <p className="text-sm text-on-surface-variant">Total Proses</p>
              <p className="mt-2 text-3xl font-bold text-secondary">{totalDatasets}</p>
              <p className="mt-1 text-xs text-on-surface-variant">dataset diproses</p>
            </div>

            {/* Average Match Rate */}
            <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
              <p className="text-sm text-on-surface-variant">Rata-rata Match Rate</p>
              <p className="mt-2 text-3xl font-bold text-success">
                {averageMatchRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">dari semua bulan</p>
            </div>

            {/* Verifikasi Tersisa */}
            <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
              <p className="text-sm text-on-surface-variant">Verifikasi Tersisa</p>
              <p className="mt-2 text-3xl font-bold text-warning">
                {remainingVerification.toLocaleString('id-ID')}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {verificationRate}% sudah terverifikasi
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mb-8 rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-on-surface">Aktivitas Terbaru</h2>
          <div className="space-y-4">
            {summary.recentActivity.map((activity: HistoryRecord, index: number) => {
              const activityDate = new Date(activity.createdAt);
              const formattedDate = activityDate.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const formattedTime = activityDate.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={activity.id} className="flex items-start gap-4 pb-4 last:pb-0">
                  <div className="mt-1 flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="material-symbols-outlined text-base text-primary">
                        {getActivityIcon(activity.action)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">{activity.description}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {activity.userName && `oleh ${activity.userName} • `}
                      {formattedDate} {formattedTime}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Stats Section */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
          {/* Top Performers */}
          <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-on-surface">Karyawan Terbaik</h2>
            <div className="space-y-4">
              {summary.topPerformingEmployees.map((employee: EmployeeProgress, index: number) => (
                <div key={employee.employeeId} className="flex items-center justify-between pb-4 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                      <span className="text-sm font-semibold text-secondary">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">{employee.employeeName}</p>
                      <p className="text-xs text-on-surface-variant">{employee.completed} selesai</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">{employee.completionRate.toFixed(1)}%</p>
                    <p className="text-xs text-on-surface-variant">Penyelesaian</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-on-surface">Status Sistem</h2>
            <div className="space-y-4">
              {/* Operational Status */}
              <div className="flex items-center justify-between pb-4 border-b border-outline">
                <div>
                  <p className="font-semibold text-on-surface">Status Operasional</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Sistem sedang berjalan</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <span className="material-symbols-outlined text-success">check_circle</span>
                </div>
              </div>

              {/* Running Processes */}
              <div className="flex items-center justify-between pb-4">
                <div>
                  <p className="font-semibold text-on-surface">Proses Berjalan</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Matching & verifikasi</p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {summary.topPerformingEmployees.reduce((sum, emp) => sum + emp.inProgress, 0)}
                </p>
              </div>

              {/* Uptime Percentage */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-on-surface">Waktu Aktif</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Bulan ini</p>
                </div>
                <p className="text-2xl font-bold text-success">99.8%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
