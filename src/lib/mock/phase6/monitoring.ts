/**
 * Phase 6 Mock Data - Monitoring
 * Realistic operational data for process and employee monitoring
 */

import type { MonitoringProcess, EmployeeProgress, MonitoringSummary } from '@/types/phase6';

// ============================================================================
// Monitoring Processes - Internally Consistent
// ============================================================================

// 3 completed, 2 running, 1 failed = 6 total processes
export const mockMonitoringProcesses: MonitoringProcess[] = [
  {
    id: 'PR-2026-001',
    datasetA: 'Sensus_Ekonomi_2024',
    datasetB: 'Dukcapil_Malang_2024',
    status: 'COMPLETED',
    progress: 100,
    totalRecords: 45000,
    processedRecords: 45000,
    startTime: '2026-09-01T08:00:00Z',
    endTime: '2026-09-01T14:30:00Z',
    threshold: 0.7,
    createdBy: 'Admin BPS',
  },
  {
    id: 'PR-2026-002',
    datasetA: 'DTKS_Kota_Malang',
    datasetB: 'Penerima_Bansos_2024',
    status: 'COMPLETED',
    progress: 100,
    totalRecords: 28000,
    processedRecords: 28000,
    startTime: '2026-09-02T09:00:00Z',
    endTime: '2026-09-02T16:45:00Z',
    threshold: 0.75,
    createdBy: 'Admin BPS',
  },
  {
    id: 'PR-2026-003',
    datasetA: 'UMKM_Diskop_Malang',
    datasetB: 'Pajak_Bapenda_2024',
    status: 'RUNNING',
    progress: 67,
    totalRecords: 15000,
    processedRecords: 10050,
    startTime: '2026-09-10T10:00:00Z',
    threshold: 0.7,
    createdBy: 'Admin BPS',
  },
  {
    id: 'PR-2026-004',
    datasetA: 'Data_Kemiskinan_DTKS',
    datasetB: 'PKH_BPNT_Data',
    status: 'RUNNING',
    progress: 34,
    totalRecords: 22000,
    processedRecords: 7480,
    startTime: '2026-09-11T08:30:00Z',
    threshold: 0.8,
    createdBy: 'Admin BPS',
  },
  {
    id: 'PR-2026-005',
    datasetA: 'OSS_Badan_Usaha_2024',
    datasetB: 'SIUP_Malang_2024',
    status: 'COMPLETED',
    progress: 100,
    totalRecords: 8500,
    processedRecords: 8500,
    startTime: '2026-09-05T07:00:00Z',
    endTime: '2026-09-05T11:20:00Z',
    threshold: 0.65,
    createdBy: 'Admin BPS',
  },
  {
    id: 'PR-2026-006',
    datasetA: 'Data_penduduk_Miskin',
    datasetB: 'Bantuan_Kemensos',
    status: 'FAILED',
    progress: 23,
    totalRecords: 35000,
    processedRecords: 8050,
    startTime: '2026-09-08T09:00:00Z',
    errorMessage: 'Memory overflow during string similarity calculation',
    threshold: 0.7,
    createdBy: 'Admin BPS',
  },
];

// ============================================================================
// Employee Progress - Internally Consistent
// ============================================================================

// 5 employees with consistent totals
// totalAssigned = completed + pending + inProgress
// completionRate = (completed / totalAssigned) * 100

export const mockEmployeeProgress: EmployeeProgress[] = [
  {
    employeeId: 1,
    employeeName: 'Budi Santoso',
    email: 'budi.santoso@bps.go.id',
    totalAssigned: 45,
    completed: 38,
    pending: 5,
    inProgress: 2,
    matchCount: 28,
    nonMatchCount: 10,
    completionRate: 84.4,
    averageTimePerTask: 12,
    lastActivityAt: '2026-09-12T14:30:00Z',
  },
  {
    employeeId: 2,
    employeeName: 'Siti Rahayu',
    email: 'siti.rahayu@bps.go.id',
    totalAssigned: 52,
    completed: 45,
    pending: 4,
    inProgress: 3,
    matchCount: 32,
    nonMatchCount: 13,
    completionRate: 86.5,
    averageTimePerTask: 10,
    lastActivityAt: '2026-09-12T15:45:00Z',
  },
  {
    employeeId: 3,
    employeeName: 'Ahmad Wijaya',
    email: 'ahmad.wijaya@bps.go.id',
    totalAssigned: 38,
    completed: 30,
    pending: 6,
    inProgress: 2,
    matchCount: 22,
    nonMatchCount: 8,
    completionRate: 78.9,
    averageTimePerTask: 15,
    lastActivityAt: '2026-09-12T13:20:00Z',
  },
  {
    employeeId: 4,
    employeeName: 'Dewi Lestari',
    email: 'dewi.lestari@bps.go.id',
    totalAssigned: 60,
    completed: 55,
    pending: 3,
    inProgress: 2,
    matchCount: 40,
    nonMatchCount: 15,
    completionRate: 91.7,
    averageTimePerTask: 8,
    lastActivityAt: '2026-09-12T16:00:00Z',
  },
  {
    employeeId: 5,
    employeeName: 'Rudi Hermawan',
    email: 'rudi.hermawan@bps.go.id',
    totalAssigned: 25,
    completed: 18,
    pending: 5,
    inProgress: 2,
    matchCount: 12,
    nonMatchCount: 6,
    completionRate: 72.0,
    averageTimePerTask: 18,
    lastActivityAt: '2026-09-12T12:15:00Z',
  },
];

// ============================================================================
// Derived Summary - Computed from processes and employee data
// ============================================================================

// Active processes: RUNNING status
const activeProcesses = mockMonitoringProcesses.filter(p => p.status === 'RUNNING').length;

// Total employees
const totalEmployees = mockEmployeeProgress.length;

// Total pending assignments
const totalPendingAssignments = mockEmployeeProgress.reduce((sum, e) => sum + e.pending, 0);

// Total completed today (approximation from completionRate)
const totalCompletedToday = mockEmployeeProgress.reduce((sum, e) => Math.round(e.completed * 0.02), 0);

// Average completion rate
const averageCompletionRate = Math.round(
  mockEmployeeProgress.reduce((sum, e) => sum + e.completionRate, 0) / totalEmployees
);

export const mockMonitoringSummary: MonitoringSummary = {
  activeProcesses,
  totalEmployees,
  totalPendingAssignments,
  totalCompletedToday,
  averageCompletionRate,
};

