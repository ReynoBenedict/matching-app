/**
 * Report service (Laporan)
 * Minimal, real report summaries built from existing database data:
 * datasets, dataset records, assignments, verification results, users and
 * audit_logs. Nothing is invented — metrics that cannot be derived from the
 * current schema are simply not produced.
 *
 * Reuses the monitoring service (assignments/users) and the history service
 * (audit_logs) instead of duplicating their queries.
 */

import { getDatabase } from '@/lib/db';
import { datasetRecords, datasets } from '@/lib/db/schema';
import { count } from 'drizzle-orm';
import { getActivityByAction } from '@/lib/services/history';
import { getMonitoringDashboard } from '@/lib/services/monitoring';
import { getAuditActionMeta } from '@/lib/constants/audit-actions';

export type ReportTypeKey = 'ringkasan-pencocokan' | 'kinerja-keseluruhan' | 'kinerja-pegawai';

export interface ReportMetric {
  label: string;
  value: string;
  hint?: string;
}

export interface ReportTable {
  columns: string[];
  rows: string[][];
}

export interface ReportSection {
  title: string;
  note?: string;
  metrics?: ReportMetric[];
  table?: ReportTable;
}

export interface ReportResult {
  type: ReportTypeKey;
  title: string;
  description: string;
  generatedAt: string;
  range: { from: string | null; to: string | null };
  sections: ReportSection[];
}

export const REPORT_TYPE_META: Record<ReportTypeKey, { title: string; description: string }> = {
  'ringkasan-pencocokan': {
    title: 'Ringkasan Pencocokan',
    description: 'Rekap dataset, record, dan hasil verifikasi kandidat pencocokan.',
  },
  'kinerja-keseluruhan': {
    title: 'Kinerja Keseluruhan',
    description: 'Progres penugasan/verifikasi serta aktivitas sistem.',
  },
  'kinerja-pegawai': {
    title: 'Kinerja Pegawai',
    description: 'Penugasan dan penyelesaian verifikasi per pegawai.',
  },
};

function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}

function toPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Build a real report for the requested type/category.
 * The date range applies to time-based activity metrics only; other figures are
 * current-state aggregates and are labelled as such.
 */
export async function generateReport({
  type,
  from,
  to,
}: {
  type: ReportTypeKey;
  from?: string;
  to?: string;
}): Promise<ReportResult> {
  const db = getDatabase();
  const meta = REPORT_TYPE_META[type] ?? REPORT_TYPE_META['ringkasan-pencocokan'];

  const [monitoring, activityByAction, datasetRows, recordTotalRows] = await Promise.all([
    getMonitoringDashboard(),
    getActivityByAction({ from, to }),
    db
      .select({
        id: datasets.id,
        name: datasets.name,
        datasetType: datasets.datasetType,
        status: datasets.status,
        totalRecords: datasets.totalRecords,
        validRecords: datasets.validRecords,
      })
      .from(datasets),
    db.select({ value: count() }).from(datasetRecords),
  ]);

  const totalCandidates = monitoring.assignments.total;
  const matchCount = monitoring.assignments.matchCount;
  const nonMatchCount = monitoring.assignments.nonMatchCount;
  const verified = matchCount + nonMatchCount;
  const readyDatasets = datasetRows.filter((dataset) => dataset.status === 'READY').length;
  const totalDatasetRecords = Number(recordTotalRows[0]?.value ?? 0);
  const employeesWithWork = monitoring.employees.filter((employee) => employee.totalAssigned > 0);
  const employeesWithWorkCount = employeesWithWork.length;

  const sections: ReportSection[] = [];

  if (type === 'ringkasan-pencocokan') {
    sections.push({
      title: 'Ringkasan Data',
      note: 'Kondisi saat ini',
      metrics: [
        { label: 'Total Dataset', value: formatNumber(datasetRows.length) },
        { label: 'Dataset READY', value: formatNumber(readyDatasets) },
        { label: 'Total Record Dataset', value: formatNumber(totalDatasetRecords) },
        { label: 'Total Kandidat', value: formatNumber(totalCandidates) },
        { label: 'MATCH', value: formatNumber(matchCount) },
        { label: 'NON-MATCH', value: formatNumber(nonMatchCount) },
        { label: 'Belum Diverifikasi', value: formatNumber(totalCandidates - verified) },
        { label: 'Tingkat Verifikasi', value: `${toPercentage(verified, totalCandidates)}%` },
      ],
    });
    sections.push({
      title: 'Rincian Dataset',
      note: 'Sumber: tabel datasets dan dataset_records',
      table: {
        columns: ['Nama Dataset', 'Tipe', 'Status', 'Total Record', 'Valid Record'],
        rows: datasetRows.map((dataset) => [
          dataset.name,
          dataset.datasetType,
          dataset.status,
          formatNumber(dataset.totalRecords ?? 0),
          formatNumber(dataset.validRecords ?? 0),
        ]),
      },
    });
  } else if (type === 'kinerja-keseluruhan') {
    sections.push({
      title: 'Kinerja Penugasan & Verifikasi',
      note: 'Kondisi saat ini',
      metrics: [
        { label: 'Total Penugasan', value: formatNumber(monitoring.assignments.total) },
        { label: 'Selesai', value: formatNumber(monitoring.assignments.completed) },
        { label: 'Menunggu Verifikasi', value: formatNumber(monitoring.assignments.pending) },
        { label: 'Sedang Dikerjakan', value: formatNumber(monitoring.assignments.inProgress) },
        { label: 'Progres Penugasan', value: `${monitoring.assignments.overallProgress}%` },
        { label: 'Rata-rata Penyelesaian', value: `${monitoring.summary.averageCompletionRate}%` },
        { label: 'Total Pegawai', value: formatNumber(monitoring.summary.totalEmployees) },
      ],
    });
    sections.push({
      title: 'Aktivitas Sistem',
      note: from || to ? 'Periode terpilih' : 'Seluruh periode',
      table: {
        columns: ['Jenis Aktivitas', 'Jumlah'],
        rows: activityByAction.map((row) => [
          getAuditActionMeta(row.action).label,
          formatNumber(row.total),
        ]),
      },
    });
  } else {
    sections.push({
      title: 'Ringkasan Pegawai',
      note: 'Kondisi saat ini',
      metrics: [
        { label: 'Total Pegawai', value: formatNumber(monitoring.summary.totalEmployees) },
        { label: 'Pegawai dengan Penugasan', value: formatNumber(employeesWithWorkCount) },
        { label: 'Rata-rata Penyelesaian', value: `${monitoring.summary.averageCompletionRate}%` },
      ],
    });
    sections.push({
      title: 'Rincian Kinerja Pegawai',
      note: 'Sumber: penugasan dan verifikasi per pegawai',
      table: {
        columns: ['Nama Pegawai', 'Email', 'Ditugaskan', 'Selesai', 'Menunggu Verifikasi', 'Progres'],
        rows: monitoring.employees
          .slice()
          .sort((a, b) => b.completed - a.completed || b.totalAssigned - a.totalAssigned)
          .map((employee) => [
            employee.fullName,
            employee.email,
            formatNumber(employee.totalAssigned),
            formatNumber(employee.completed),
            formatNumber(employee.pending),
            `${employee.completionRate}%`,
          ]),
      },
    });
  }

  return {
    type,
    title: meta.title,
    description: meta.description,
    generatedAt: new Date().toISOString(),
    range: { from: from ?? null, to: to ?? null },
    sections,
  };
}
