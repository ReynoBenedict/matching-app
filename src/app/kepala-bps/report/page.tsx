'use client';

import { useState, useEffect } from 'react';
import { mockMatchingResults } from '@/lib/mock/phase6/results';
import { mockEmployeeProgress } from '@/lib/mock/phase6/monitoring';

type ReportType = 'matching-summary' | 'overall-performance' | 'employee-performance';

type ReportDescriptions = Record<ReportType, {
  title: string;
  description: string;
}>;

const reportDescriptions: ReportDescriptions = {
  'matching-summary': {
    title: 'Ringkasan Pencocokan',
    description: 'Laporan detail tentang hasil pencocokan data antar dataset',
  },
  'overall-performance': {
    title: 'Kinerja Keseluruhan',
    description: 'Ringkasan performa proses pencocokan secara keseluruhan',
  },
  'employee-performance': {
    title: 'Kinerja Karyawan',
    description: 'Analisis kinerja individu setiap karyawan dalam verifikasi data',
  },
};

export default function ReportPage() {
  const [reportType, setReportType] = useState<ReportType>('matching-summary');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<number | 'ALL'>('ALL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  // Calculate default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateRangeStart((prev) => prev || formatDate(thirtyDaysAgo));
    setDateRangeEnd((prev) => prev || formatDate(today));
  }, []);

  // Extract unique datasets from mock data
  const uniqueDatasets = Array.from(
    new Set(
      mockMatchingResults.flatMap((result) => [result.datasetA, result.datasetB])
    )
  ).sort();

  // Extract employee names from mock data
  const employees = mockEmployeeProgress.map((emp) => ({
    id: emp.employeeId,
    name: emp.employeeName,
  }));

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setShowMessage(false);

    // Simulate API call delay (1-2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setShowMessage(true);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-on-surface">Laporan</h1>
          <p className="mt-2 text-on-surface-variant">
            Persiapan UI untuk integrasi backend
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-8 rounded-lg border border-blue-300 bg-blue-50 p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 flex-shrink-0 mt-0.5">
            info
          </span>
          <p className="text-sm text-blue-900">
            Fitur laporan sedang dikembangkan. Harap menunggu integrasi backend.
          </p>
        </div>

        {/* Main Report Form */}
        <div className="rounded-lg border border-outline bg-surface-container p-6 shadow-sm">
          {/* Report Type Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-on-surface mb-4">
              Jenis Laporan
            </h2>
            <div className="space-y-3">
              {(Object.keys(reportDescriptions) as ReportType[]).map((type) => (
                <label
                  key={type}
                  className="flex items-start gap-3 p-3 rounded-lg border border-outline hover:bg-surface-container-highest transition-colors cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type}
                    checked={reportType === type}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="mt-1 w-4 h-4 text-primary cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">
                      {reportDescriptions[type].title}
                    </p>
                    <p className="text-sm text-on-surface-variant mt-1">
                      {reportDescriptions[type].description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Filters Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-on-surface mb-4">
              Filter Laporan
            </h2>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Dataset Selection - Conditional */}
            {reportType === 'matching-summary' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Pilih Dataset
                </label>
                <select
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                >
                  <option value="ALL">Semua Dataset</option>
                  {uniqueDatasets.map((dataset) => (
                    <option key={dataset} value={dataset}>
                      {dataset}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Employee Filter - Conditional */}
            {reportType === 'employee-performance' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Pilih Karyawan
                </label>
                <select
                  value={selectedEmployee === 'ALL' ? 'ALL' : selectedEmployee}
                  onChange={(e) =>
                    setSelectedEmployee(
                      e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
                    )
                  }
                  className="w-full px-4 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                >
                  <option value="ALL">Semua Karyawan</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="px-6 py-2 rounded-lg font-semibold text-on-primary bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating && (
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  hourglass_empty
                </span>
              )}
              {isGenerating ? 'Memproses laporan...' : 'Buat Laporan'}
            </button>
          </div>
        </div>

        {/* Message Section */}
        {showMessage && (
          <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 flex-shrink-0 mt-0.5">
              schedule
            </span>
            <div>
              <p className="font-medium text-amber-900">
                Laporan akan segera tersedia
              </p>
              <p className="text-sm text-amber-800 mt-1">
                Laporan akan segera tersedia setelah integrasi API backend.
              </p>
            </div>
          </div>
        )}

        {/* Loading State with Spinner */}
        {isGenerating && (
          <div className="mt-8 rounded-lg border border-blue-300 bg-blue-50 p-6 text-center">
            <span
              className="material-symbols-outlined text-4xl text-blue-600 inline-block mb-3"
              style={{ animation: 'spin 2s linear infinite' }}
            >
              hourglass_empty
            </span>
            <p className="text-on-surface-variant font-medium">
              Memproses laporan...
            </p>
          </div>
        )}
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
