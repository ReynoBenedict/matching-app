/**
 * Phase 6 Mock Data - Reports
 * Realistic operational data for report generation and download
 */

import type { GeneratedReport, ReportConfig, ReportSummary, ReportType, ReportFormat, ReportStatus } from '@/types/phase6';

// ============================================================================
// Report Configurations - Common configurations
// ============================================================================

export const mockReportConfigs: Record<ReportType, ReportConfig> = {
  MATCHING_SUMMARY: {
    type: 'MATCHING_SUMMARY',
    dateRange: { start: '2026-09-01', end: '2026-09-30' },
    format: 'PDF',
    includeDetails: true,
  },
  VERIFICATION_PROGRESS: {
    type: 'VERIFICATION_PROGRESS',
    dateRange: { start: '2026-09-01', end: '2026-09-30' },
    format: 'XLSX',
    includeDetails: false,
  },
  EMPLOYEE_PERFORMANCE: {
    type: 'EMPLOYEE_PERFORMANCE',
    dateRange: { start: '2026-09-01', end: '2026-09-30' },
    format: 'XLSX',
    includeDetails: true,
    employeeIds: [1, 2, 3, 4, 5],
  },
  EXECUTIVE_SUMMARY: {
    type: 'EXECUTIVE_SUMMARY',
    dateRange: { start: '2026-09-01', end: '2026-09-30' },
    format: 'PDF',
    includeDetails: true,
  },
};

// ============================================================================
// Generated Reports - Internally Consistent
// ============================================================================

// 5 reports: status distribution - 3 READY, 1 PENDING, 1 FAILED
// Total size: 45.2 MB

export const mockGeneratedReports: GeneratedReport[] = [
  {
    id: 'RPT-2026-001',
    name: 'Laporan Ringkasan Pencocokan - September 2026',
    type: 'MATCHING_SUMMARY',
    format: 'PDF',
    status: 'READY',
    config: mockReportConfigs.MATCHING_SUMMARY,
    fileSize: '12.5 MB',
    downloadUrl: '/api/reports/download/RPT-2026-001',
    recordCount: 1984,
    createdAt: '2026-09-12T10:00:00Z',
    createdBy: 1,
    expiresAt: '2026-10-12T10:00:00Z',
  },
  {
    id: 'RPT-2026-002',
    name: 'Laporan Progres Verifikasi - September 2026',
    type: 'VERIFICATION_PROGRESS',
    format: 'XLSX',
    status: 'READY',
    config: mockReportConfigs.VERIFICATION_PROGRESS,
    fileSize: '8.3 MB',
    downloadUrl: '/api/reports/download/RPT-2026-002',
    recordCount: 220,
    createdAt: '2026-09-12T11:30:00Z',
    createdBy: 1,
    expiresAt: '2026-10-12T11:30:00Z',
  },
  {
    id: 'RPT-2026-003',
    name: 'Laporan Kinerja Pegawai - September 2026',
    type: 'EMPLOYEE_PERFORMANCE',
    format: 'XLSX',
    status: 'READY',
    config: mockReportConfigs.EMPLOYEE_PERFORMANCE,
    fileSize: '5.7 MB',
    downloadUrl: '/api/reports/download/RPT-2026-003',
    recordCount: 5,
    createdAt: '2026-09-12T14:00:00Z',
    createdBy: 1,
    expiresAt: '2026-10-12T14:00:00Z',
  },
  {
    id: 'RPT-2026-004',
    name: 'Laporan Eksekutif - September 2026',
    type: 'EXECUTIVE_SUMMARY',
    format: 'PDF',
    status: 'PENDING',
    config: mockReportConfigs.EXECUTIVE_SUMMARY,
    recordCount: 0,
    createdAt: '2026-09-12T15:00:00Z',
    createdBy: 1,
  },
  {
    id: 'RPT-2026-005',
    name: 'Laporan Ringkasan Pencocokan - Agustus 2026',
    type: 'MATCHING_SUMMARY',
    format: 'PDF',
    status: 'FAILED',
    config: {
      type: 'MATCHING_SUMMARY',
      dateRange: { start: '2026-08-01', end: '2026-08-31' },
      format: 'PDF',
      includeDetails: true,
    },
    fileSize: undefined,
    downloadUrl: undefined,
    recordCount: 0,
    createdAt: '2026-09-01T09:00:00Z',
    createdBy: 1,
  },
];

// ============================================================================
// Report Summary - Derived
// ============================================================================

const readyCount = mockGeneratedReports.filter(r => r.status === 'READY').length;
const pendingCount = mockGeneratedReports.filter(r => r.status === 'PENDING' || r.status === 'GENERATING').length;
const totalSize = mockGeneratedReports
  .filter(r => r.fileSize)
  .reduce((acc, r) => {
    if (!r.fileSize) return acc;
    const sizeNum = parseFloat(r.fileSize);
    const unit = r.fileSize.includes('MB') ? 1 : 0.001;
    return acc + sizeNum * unit;
  }, 0);

export const mockReportSummary: ReportSummary = {
  totalReports: mockGeneratedReports.length,
  readyCount,
  pendingCount,
  totalSize: totalSize.toFixed(1) + ' MB',
};

// ============================================================================
// Report Type Metadata
// ============================================================================

export const reportTypeMeta: Record<ReportType, { label: string; description: string; icon: string }> = {
  MATCHING_SUMMARY: {
    label: 'Ringkasan Pencocokan',
    description: 'Laporan hasil pencocokan data antar dataset',
    icon: 'compare',
  },
  VERIFICATION_PROGRESS: {
    label: 'Progres Verifikasi',
    description: 'Laporan progres verifikasi penugasan oleh petugas',
    icon: 'fact_check',
  },
  EMPLOYEE_PERFORMANCE: {
    label: 'Kinerja Pegawai',
    description: 'Laporan kinerja dan produktivitas petugas verifikasi',
    icon: 'groups',
  },
  EXECUTIVE_SUMMARY: {
    label: 'Ringkasan Eksekutif',
    description: 'Ringkasan eksekutif untuk Kepala BPS',
    icon: 'summarize',
  },
};

export const reportFormatMeta: Record<ReportFormat, { label: string; icon: string }> = {
  PDF: { label: 'PDF', icon: 'picture_as_pdf' },
  XLSX: { label: 'Excel', icon: 'table_chart' },
  CSV: { label: 'CSV', icon: 'grid_on' },
};

export const reportStatusMeta: Record<ReportStatus, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Menunggu', color: 'text-warning', icon: 'schedule' },
  GENERATING: { label: 'Sedang Dibuat', color: 'text-secondary', icon: 'sync' },
  READY: { label: 'Siap', color: 'text-primary', icon: 'check_circle' },
  FAILED: { label: 'Gagal', color: 'text-error', icon: 'error' },
};