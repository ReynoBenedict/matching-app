/**
 * ReportContent - shared Laporan UI for Superadmin and Kepala BPS (read-only).
 * Every figure comes from /api/reports/summary, which aggregates the real
 * database. No mock data and no hardcoded report values.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { ReportResult, ReportTypeKey } from '@/lib/services/report';

const REPORT_TYPES: { key: ReportTypeKey; title: string; description: string }[] = [
  {
    key: 'ringkasan-pencocokan',
    title: 'Ringkasan Pencocokan',
    description: 'Rekap dataset, record, dan hasil verifikasi kandidat pencocokan.',
  },
  {
    key: 'kinerja-keseluruhan',
    title: 'Kinerja Keseluruhan',
    description: 'Progres penugasan/verifikasi serta aktivitas sistem.',
  },
  {
    key: 'kinerja-pegawai',
    title: 'Kinerja Pegawai',
    description: 'Penugasan dan penyelesaian verifikasi per pegawai.',
  },
];

function formatDateTime(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReportContent({ backHref }: { backHref: string }) {
  const [type, setType] = useState<ReportTypeKey>('ringkasan-pencocokan');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pure fetcher — performs no state updates, so it is safe to await anywhere.
  const fetchReport = useCallback(
    async (reportType: ReportTypeKey, fromDate: string, toDate: string): Promise<ReportResult> => {
      const params = new URLSearchParams({ type: reportType });
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const response = await fetch(`/api/reports/summary?${params}`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Gagal membuat laporan');
      }

      return payload.data as ReportResult;
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await fetchReport(type, from, to);
        if (cancelled) return;
        setReport(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal membuat laporan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [type, from, to, fetchReport]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await fetchReport(type, from, to);
      setReport(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat laporan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-lg">
      {/* Back navigation */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-sm text-secondary font-label-md hover:underline"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        Kembali ke Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-md">
        <div className="flex flex-col gap-xs">
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Laporan</h1>
          <p className="text-on-surface-variant font-body-md text-body-md">
            Ringkasan laporan berdasarkan data nyata pada basis data sistem.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-md py-sm bg-surface border border-outline text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors flex items-center gap-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`} style={{ fontSize: '20px' }}>
            refresh
          </span>
          {loading ? 'Memuat...' : 'Tampilkan Laporan'}
        </button>
      </div>

      {/* Configuration */}
      <div className="bg-surface rounded-lg border border-outline p-lg">
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-md">Jenis Laporan</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
          {REPORT_TYPES.map((item) => (
            <label
              key={item.key}
              className={`flex items-start gap-sm p-md rounded-lg border transition-colors cursor-pointer ${
                type === item.key
                  ? 'border-secondary bg-surface-container-low'
                  : 'border-outline hover:bg-surface-container-low'
              }`}
            >
              <input
                type="radio"
                name="reportType"
                value={item.key}
                checked={type === item.key}
                onChange={() => setType(item.key)}
                className="mt-1 w-4 h-4 cursor-pointer"
              />
              <span className="flex-1">
                <span className="block font-label-lg text-label-lg text-on-surface font-semibold">{item.title}</span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant mt-xs">{item.description}</span>
              </span>
            </label>
          ))}
        </div>

        <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-sm">Rentang Tanggal (opsional)</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
          Rentang hanya memengaruhi metrik aktivitas sistem. Kosongkan untuk seluruh periode.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label htmlFor="report-from" className="font-label-md text-label-md text-on-surface-variant">
              Dari Tanggal
            </label>
            <input
              id="report-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="px-md py-sm border border-outline rounded-lg font-body-md text-on-surface bg-surface"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label htmlFor="report-to" className="font-label-md text-label-md text-on-surface-variant">
              Hingga Tanggal
            </label>
            <input
              id="report-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="px-md py-sm border border-outline rounded-lg font-body-md text-on-surface bg-surface"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error-container border-l-4 border-error p-lg rounded-lg">
          <div className="flex items-start gap-md">
            <span className="material-symbols-outlined text-error">error</span>
            <p className="text-on-error-container font-body-md">{error}</p>
          </div>
        </div>
      )}

      {/* Report */}
      {loading && !report ? (
        <div className="flex flex-col items-center justify-center py-3xl gap-md">
          <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>
            progress_activity
          </span>
          <p className="text-on-surface-variant font-body-lg">Membuat laporan...</p>
        </div>
      ) : (
        report &&
        !error && (
          <>
            {/* Report header */}
            <div className="bg-surface rounded-lg border border-outline p-lg flex flex-wrap justify-between items-end gap-sm">
              <div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{report.title}</h2>
                <p className="text-on-surface-variant font-body-md mt-xs">{report.description}</p>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant">
                Dibuat: {formatDateTime(report.generatedAt)}
              </p>
            </div>

            {/* Sections */}
            {report.sections.map((section) => (
              <div key={section.title} className="bg-surface rounded-lg border border-outline overflow-hidden">
                <div className="p-lg border-b border-outline flex flex-wrap justify-between items-center gap-sm">
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">{section.title}</h3>
                  {section.note && (
                    <span className="font-label-md text-label-md text-on-surface-variant">{section.note}</span>
                  )}
                </div>

                {section.metrics && (
                  <div className="p-lg grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md">
                    {section.metrics.map((metric) => (
                      <div key={metric.label} className="bg-surface-container-low rounded-lg border border-outline p-md">
                        <p className="font-label-md text-label-md text-on-surface-variant">{metric.label}</p>
                        <p className="font-headline-md text-headline-md font-bold text-on-surface mt-xs">{metric.value}</p>
                        {metric.hint && (
                          <p className="font-label-md text-label-md text-on-surface-variant mt-xs">{metric.hint}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {section.table && (
                  section.table.rows.length === 0 ? (
                    <div className="py-3xl text-center">
                      <span className="material-symbols-outlined text-outline" style={{ fontSize: '40px' }}>
                        table_view
                      </span>
                      <p className="text-on-surface-variant font-body-md mt-md">Data tidak tersedia.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px]">
                        <thead className="bg-surface-container-low border-b border-outline">
                          <tr>
                            {section.table.columns.map((column) => (
                              <th key={column} className="text-left p-md font-label-lg text-label-lg text-on-surface-variant">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.table.rows.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors"
                            >
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="p-md font-body-md text-body-md text-on-surface align-top">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            ))}

            {/* Info */}
            <div className="bg-surface-container rounded-lg border border-outline p-lg">
              <div className="flex items-start gap-md">
                <span className="material-symbols-outlined text-primary">info</span>
                <div>
                  <h3 className="font-label-lg text-label-lg text-on-surface font-semibold mb-sm">
                    Tentang Halaman Laporan
                  </h3>
                  <p className="text-on-surface-variant font-body-md">
                    Seluruh angka pada laporan ini dihitung langsung dari basis data (dataset, record, penugasan,
                    hasil verifikasi, pegawai, dan log audit). Metrik yang tidak dapat dihitung dari data yang ada
                    tidak ditampilkan.
                  </p>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
