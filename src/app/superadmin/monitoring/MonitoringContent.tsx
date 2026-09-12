/**
 * MonitoringContent - Main monitoring dashboard component
 * Phase 6A: Superadmin Monitoring Dashboard with Assignment Progress & Statistics
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import { 
  mockMonitoringProcesses, 
  mockEmployeeProgress, 
  mockMonitoringSummary 
} from '@/lib/mock/phase6/monitoring';
import type { MonitoringProcess, EmployeeProgress, MonitoringSummary, ProcessStatus } from '@/types/phase6';

// ============================================================================
// Helper Components (reused from existing patterns)
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

function StatusBadge({ status }: { status: ProcessStatus }) {
  const styles = {
    RUNNING: 'bg-secondary-fixed text-on-secondary-fixed',
    COMPLETED: 'bg-surface-container-high text-on-surface',
    FAILED: 'bg-error-container text-on-error-container',
    PAUSED: 'bg-warning-container text-on-warning-container',
  };
  
  const labels = {
    RUNNING: 'Berjalan',
    COMPLETED: 'Selesai',
    FAILED: 'Gagal',
    PAUSED: 'Dijeda',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status === 'RUNNING' && <span className="material-symbols-outlined animate-spin text-[12px] mr-1">sync</span>}
      {labels[status]}
    </span>
  );
}

function ProgressBar({ value, showLabel = true, className = '' }: { value: number; showLabel?: boolean; className?: string }) {
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
          style={{ width: `${value}%` }} 
        />
      </div>
      {showLabel && <span className="text-xs text-on-surface-variant w-10">{value}%</span>}
    </div>
  );
}

function EmployeeStatusBadge({ completionRate }: { completionRate: number }) {
  let status: string;
  let style: string;
  
  if (completionRate >= 90) {
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

// ============================================================================
// Chart Components (matching existing Superadmin dashboard patterns)
// ============================================================================

function BarChart({ data, height = 200 }: { data: { label: string; value: number }[]; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="flex items-end justify-between gap-2 px-4 pb-4 pt-6" style={{ height }}>
      {data.map((item, idx) => {
        const heightPercent = (item.value / maxValue) * 100;
        const isHigh = heightPercent >= 70;
        
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
            <div 
              className={`w-full rounded-t-sm transition-colors ${
                isHigh ? 'bg-primary-container hover:bg-primary' : 'bg-secondary-container hover:bg-secondary'
              }`}
              style={{ height: `${heightPercent}%`, minHeight: '4px' }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="font-label-md text-xs text-on-surface-variant">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  // Calculate gradient stops without mutation
  const gradientStops = data.reduce<{ stops: string; accumulated: number }>(
    (acc, d) => {
      const percentage = (d.value / total) * 100;
      const start = acc.accumulated;
      const end = acc.accumulated + percentage;
      const stop = `${d.color} ${start}% ${end}%`;
      return {
        stops: acc.stops ? `${acc.stops}, ${stop}` : stop,
        accumulated: end,
      };
    },
    { stops: '', accumulated: 0 }
  ).stops;
  
  const innerSize = size * 0.6;
  
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
        <span className="font-headline-sm text-primary">{total.toLocaleString('id-ID')}</span>
        <span className="font-label-md text-xs text-on-surface-variant">Total</span>
      </div>
    </div>
  );
}

function ProcessCard({ process }: { process: MonitoringProcess }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-headline-sm text-on-surface">{process.id}</h4>
          <p className="font-label-md text-xs text-on-surface-variant mt-1">
            {process.datasetA} ↔ {process.datasetB}
          </p>
        </div>
        <StatusBadge status={process.status} />
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-label-md text-xs text-on-surface-variant">Progress</span>
            <span className="font-label-md text-xs text-on-surface">
              {process.processedRecords.toLocaleString('id-ID')} / {process.totalRecords.toLocaleString('id-ID')}
            </span>
          </div>
          <ProgressBar value={process.progress} />
        </div>
        
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
            Threshold: {Math.round(process.threshold * 100)}%
          </span>
          <span>
            {process.status === 'COMPLETED' && process.endTime 
              ? new Date(process.endTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : process.status === 'RUNNING'
              ? new Date(process.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : '-'
            }
          </span>
        </div>
        
        {process.status === 'FAILED' && process.errorMessage && (
          <div className="bg-error-container text-on-error-container p-2 rounded text-xs">
            <span className="material-symbols-outlined text-[14px] mr-1">error</span>
            {process.errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Assignment Progress Section Component
// ============================================================================

function AssignmentProgressSection({ employees }: { employees: EmployeeProgress[] }) {
  // Calculate totals from employee data (ensure consistency)
  const totals = useMemo(() => {
    const totalAssigned = employees.reduce((sum, e) => sum + e.totalAssigned, 0);
    const totalCompleted = employees.reduce((sum, e) => sum + e.completed, 0);
    const totalPending = employees.reduce((sum, e) => sum + e.pending, 0);
    const totalInProgress = employees.reduce((sum, e) => sum + e.inProgress, 0);
    const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
    
    return { totalAssigned, totalCompleted, totalPending, totalInProgress, completionRate };
  }, [employees]);

  // Donut chart data
  const donutData = [
    { label: 'Selesai', value: totals.totalCompleted, color: '#006493' },
    { label: 'Menunggu', value: totals.totalPending, color: '#F9A825' },
    { label: 'Sedang Dikerjakan', value: totals.totalInProgress, color: '#6B7280' },
  ];

  return (
    <div className="space-y-6">
      {/* Assignment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Penugasan" 
          value={totals.totalAssigned} 
          icon="assignment" 
          tone="text-secondary"
          subtext="Semua status"
        />
        <StatCard 
          label="Selesai" 
          value={totals.totalCompleted} 
          icon="check_circle" 
          tone="text-primary"
          subtext="Terverifikasi"
        />
        <StatCard 
          label="Menunggu" 
          value={totals.totalPending} 
          icon="pending" 
          tone="text-warning"
          subtext="Belum dimulai"
        />
        <StatCard 
          label="Progres" 
          value={`${totals.completionRate}%`} 
          icon="trending_up" 
          tone="text-primary"
          subtext={`${totals.totalCompleted} dari ${totals.totalAssigned}`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Assignment Distribution */}
        <div className="bg-surface border border-outline-variant rounded-xl p-6">
          <h3 className="font-headline-sm text-primary mb-4">Distribusi Penugasan</h3>
          <div className="flex items-center justify-center gap-8">
            <DonutChart data={donutData} />
            <div className="flex flex-col gap-2">
              {donutData.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                  <span className="font-label-md text-xs text-on-surface-variant">{item.label}</span>
                  <span className="font-label-md text-xs text-on-surface font-semibold ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart - Employee Performance */}
        <div className="bg-surface border border-outline-variant rounded-xl p-6">
          <h3 className="font-headline-sm text-primary mb-4">Kinerja Petugas</h3>
          <div className="bg-surface-container-low rounded-lg border border-outline-variant/50">
            <BarChart 
              data={employees.map(e => ({
                label: e.employeeName.split(' ')[0],
                value: e.completed,
              }))} 
              height={180}
            />
          </div>
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
  const [loading, setLoading] = useState(true);
  const [processes, setProcesses] = useState<MonitoringProcess[]>([]);
  const [employees, setEmployees] = useState<EmployeeProgress[]>([]);
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'processes' | 'employees' | 'assignments'>('processes');
  const [error, setError] = useState<string | null>(null);

  // Simulate data fetching with mock data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use mock data (in real app, this would be an API call)
        setProcesses(mockMonitoringProcesses);
        setEmployees(mockEmployeeProgress);
        setSummary(mockMonitoringSummary);
        setError(null);
      } catch (err) {
        setError('Gagal memuat data monitoring');
        console.error('Monitoring fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Render loading state
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

  // Render error state
  if (error) {
    return (
      <SuperadminLayout pageTitle="Monitoring Progres">
        <div className="bg-error-container border border-error rounded-xl p-6 mb-6 flex items-start gap-3">
          <span className="material-symbols-outlined text-on-error-container" style={{ fontSize: '24px' }}>
            error
          </span>
          <div>
            <p className="font-body-md text-on-error-container">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-on-error-container text-error-container rounded-lg font-label-md hover:opacity-80"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </SuperadminLayout>
    );
  }

  const runningProcesses = processes.filter(p => p.status === 'RUNNING');
  const completedProcesses = processes.filter(p => p.status === 'COMPLETED');
  const failedProcesses = processes.filter(p => p.status === 'FAILED');

  return (
    <SuperadminLayout pageTitle="Monitoring Progres">
      {/* Breadcrumb */}
      <div className="mb-2">
        <span className="text-on-surface-variant text-label-md text-xs">
          Sistem Pencocokan Data /{' '}
          <span className="text-primary font-semibold">Monitoring Progres</span>
        </span>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-1">
          Monitoring Progres
        </h2>
        <p className="font-body-md text-on-surface-variant">
          Pantau progres proses pencocokan dan kinerja petugas verifikasi.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard 
          label="Proses Berjalan" 
          value={runningProcesses.length} 
          icon="sync" 
          tone="text-secondary"
          subtext="Aktif saat ini"
        />
        <StatCard 
          label="Selesai" 
          value={completedProcesses.length} 
          icon="check_circle" 
          tone="text-primary"
          subtext="Bulan ini"
        />
        <StatCard 
          label="Gagal" 
          value={failedProcesses.length} 
          icon="error" 
          tone="text-error"
          subtext="Perlu perhatian"
        />
        <StatCard 
          label="Total Petugas" 
          value={employees.length} 
          icon="groups" 
          tone="text-secondary"
          subtext="Aktif"
        />
        <StatCard 
          label="Rata-rata Penyelesaian" 
          value={`${summary?.averageCompletionRate || 0}%`} 
          icon="trending_up" 
          tone="text-primary"
          subtext="Semua petugas"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-outline-variant mb-6">
        <button
          onClick={() => setActiveTab('processes')}
          className={`px-4 py-2 font-label-md transition-colors border-b-2 -mb-px ${
            activeTab === 'processes'
              ? 'text-primary border-primary'
              : 'text-on-surface-variant border-transparent hover:text-on-surface'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
            Proses Pencocokan ({processes.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 font-label-md transition-colors border-b-2 -mb-px ${
            activeTab === 'assignments'
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
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 font-label-md transition-colors border-b-2 -mb-px ${
            activeTab === 'employees'
              ? 'text-primary border-primary'
              : 'text-on-surface-variant border-transparent hover:text-on-surface'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>groups</span>
            Progres Petugas ({employees.length})
          </span>
        </button>
      </div>

      {/* Processes Tab */}
      {activeTab === 'processes' && (
        <div>
          {processes.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-30">
                folder_open
              </span>
              <p className="font-body-md text-on-surface-variant mt-4">
                Tidak ada proses pencocokan.
              </p>
              <p className="font-body-sm text-on-surface-variant mt-1">
                Mulai proses pencocokan baru untuk melihat monitoring.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processes.map((process) => (
                <ProcessCard key={process.id} process={process} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab - NEW */}
      {activeTab === 'assignments' && (
        <AssignmentProgressSection employees={employees} />
      )}

      {/* Employees Tab - Table View */}
      {activeTab === 'employees' && (
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
                Tambah petugas untuk melihat progres mereka.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-high border-b border-outline-variant">
                      <th className="px-4 py-3 font-label-md text-label-md text-on-surface">Nama Petugas</th>
                      <th className="px-4 py-3 font-label-md text-label-md text-on-surface text-center">Ditugaskan</th>
                      <th className="px-4 py-3 font-label-md text-label-md text-on-surface text-center">Selesai</th>
                      <th className="px-4 py-3 font-label-md text-label-md text-on-surface text-center">Menunggu</th>
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
                            <p className="font-body-md text-on-surface font-semibold">{employee.employeeName}</p>
                            <p className="font-label-md text-xs text-on-surface-variant">{employee.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-headline-sm text-on-surface">{employee.totalAssigned}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-headline-sm text-primary">{employee.completed}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-headline-sm text-warning">{employee.pending}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <ProgressBar value={employee.completionRate} showLabel={false} className="justify-start" />
                            <span className="font-label-md text-xs text-on-surface-variant">
                              {employee.completed} dari {employee.totalAssigned} ({employee.completionRate}%)
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <EmployeeStatusBadge completionRate={employee.completionRate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Summary Footer */}
              <div className="px-4 py-3 bg-surface-container-high border-t border-outline-variant flex justify-between items-center">
                <span className="font-label-md text-xs text-on-surface-variant">
                  Total: {employees.length} petugas
                </span>
                <span className="font-label-md text-xs text-on-surface-variant">
                  Rata-rata progres: {summary?.averageCompletionRate || 0}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </SuperadminLayout>
  );
}