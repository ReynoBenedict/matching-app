'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout';

interface Dataset {
  id: number;
  name: string;
  datasetType: string;
  source: string;
  status: 'UPLOADING' | 'VALIDATING' | 'READY' | 'FAILED';
  totalRecords: number | null;
  createdAt: string;
  originalFileName: string | null;
}

interface DatasetsResponse {
  success: boolean;
  data: Dataset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

function DatasetsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
        });

        if (statusFilter) {
          params.append('status', statusFilter);
        }

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await fetch(`/api/datasets?${params.toString()}`);

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch datasets');
        }

        const data: DatasetsResponse = await response.json();
        setDatasets(data.data);
      } catch (err) {
        console.error('Error fetching datasets:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, [page, statusFilter, searchQuery, router]);

  const getStatusBadge = (status: string) => {
    const badges = {
      READY: (
        <span className="inline-flex items-center gap-1 bg-[#d4edda] text-[#155724] px-sm py-[2px] rounded-full text-[11px] font-bold">
          <span className="w-1.5 h-1.5 bg-[#28a745] rounded-full"></span> Ready
        </span>
      ),
      UPLOADING: (
        <span className="inline-flex items-center gap-1 bg-surface-container-highest text-on-surface-variant px-sm py-[2px] rounded-full text-[11px] font-bold">
          <span className="w-1.5 h-1.5 bg-outline rounded-full animate-pulse"></span> Uploading
        </span>
      ),
      VALIDATING: (
        <span className="inline-flex items-center gap-1 bg-surface-container-highest text-on-surface-variant px-sm py-[2px] rounded-full text-[11px] font-bold">
          <span className="w-1.5 h-1.5 bg-outline rounded-full animate-pulse"></span> Processing
        </span>
      ),
      FAILED: (
        <span className="inline-flex items-center gap-1 bg-error-container text-on-error-container px-sm py-[2px] rounded-full text-[11px] font-bold">
          <span className="w-1.5 h-1.5 bg-error rounded-full"></span> Failed
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || badges.READY;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <AuthenticatedLayout pageTitle="Manajemen Dataset">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-xl gap-md">
        <Link
          href="/datasets/upload"
          className="bg-primary text-on-primary px-lg py-sm rounded-xl font-label-md text-label-md flex items-center gap-sm hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm md:hidden"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Tambah Dataset
        </Link>
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-xs">
            Dataset Management
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Kelola data master (penduduk, dtks, p3ke) untuk keperluan pencocokan.
          </p>
        </div>
        <Link
          href="/datasets/upload"
          className="bg-primary text-on-primary px-lg py-sm rounded-xl font-label-md text-label-md hidden md:flex items-center gap-sm hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Tambah Dataset
        </Link>
      </div>

      {/* Bento-style Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-fixed opacity-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <p className="font-label-md text-label-md text-on-surface-variant mb-sm uppercase tracking-wider relative z-10">Total Datasets</p>
          <div className="flex items-end gap-sm relative z-10">
            <span className="font-headline-lg text-headline-lg text-primary">{datasets.length}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mb-1">Files</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary-fixed opacity-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <p className="font-label-md text-label-md text-on-surface-variant mb-sm uppercase tracking-wider relative z-10">Total Records</p>
          <div className="flex items-end gap-sm relative z-10">
            <span className="font-headline-lg text-headline-lg text-secondary">
              {datasets.reduce((sum, d) => sum + (d.totalRecords || 0), 0).toLocaleString()}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mb-1">Baris Data</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-tertiary-fixed opacity-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <p className="font-label-md text-label-md text-on-surface-variant mb-sm uppercase tracking-wider relative z-10">Storage Used</p>
          <div className="flex items-end gap-sm relative z-10">
            <span className="font-headline-lg text-headline-lg text-tertiary">4.5</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mb-1">GB</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-container border border-error rounded-xl p-lg mb-lg">
          <p className="font-body-md text-on-error-container">{error}</p>
        </div>
      )}

      {/* Data Table Section */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-md border-b border-outline-variant bg-surface-bright flex flex-col sm:flex-row justify-between items-center gap-md">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-xl pr-sm py-[6px] rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-secondary-container font-body-sm text-on-surface"
              placeholder="Filter dataset..."
              type="text"
            />
          </div>
          <div className="flex gap-sm w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-md py-xs rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-highest transition-colors font-label-md text-on-surface"
            >
              <option value="">All Status</option>
              <option value="UPLOADING">Uploading</option>
              <option value="VALIDATING">Validating</option>
              <option value="READY">Ready</option>
              <option value="FAILED">Failed</option>
            </select>
            <button className="px-md py-xs rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-highest transition-colors font-label-md text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">sort</span>
              Sort
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] animate-spin inline-block">hourglass_empty</span>
            <p className="font-body-md mt-sm">Memuat dataset...</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] opacity-30">inbox</span>
            <p className="font-body-md mt-sm">
              {searchQuery || statusFilter ? 'Tidak ada dataset yang sesuai dengan filter.' : 'Belum ada dataset yang diunggah.'}
            </p>
            {!searchQuery && !statusFilter && (
              <Link
                href="/datasets/upload"
                className="inline-block mt-md bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md hover:opacity-90 transition-opacity"
              >
                Unggah Dataset Baru
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-highest border-b border-outline-variant">
                  <th className="p-md font-label-md text-label-md text-on-surface sticky top-0 z-10 whitespace-nowrap">Dataset Name</th>
                  <th className="p-md font-label-md text-label-md text-on-surface sticky top-0 z-10 whitespace-nowrap">Source</th>
                  <th className="p-md font-label-md text-label-md text-on-surface sticky top-0 z-10 whitespace-nowrap">Format</th>
                  <th className="p-md font-label-md text-label-md text-on-surface sticky top-0 z-10 text-right whitespace-nowrap">Records</th>
                  <th className="p-md font-label-md text-label-md text-on-surface sticky top-0 z-10 text-center whitespace-nowrap">Cols</th>
                  <th className="p-md font-label-md text-label-md text-on-surface sticky top-0 z-10 whitespace-nowrap">Upload Date</th>
                  <th className="p-md font-label-md text-label-md text-on-surface sticky top-0 z-10 text-center whitespace-nowrap">Status</th>
                  <th className="p-md font-label-md text-label-md text-on-surface sticky top-0 z-10 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="font-data-tabular text-data-tabular">
                {datasets.map((dataset) => (
                  <tr
                    key={dataset.id}
                    className="border-b border-outline-variant hover:bg-surface-container-highest transition-colors group"
                  >
                    <td className="p-md text-on-surface font-semibold flex items-center gap-sm">
                      <span className="material-symbols-outlined text-secondary">database</span>
                      {dataset.name}
                    </td>
                    <td className="p-md text-on-surface-variant">{dataset.source}</td>
                    <td className="p-md text-on-surface-variant">
                      <span className="bg-surface-variant px-sm py-[2px] rounded text-on-surface-variant text-[11px] font-bold">
                        {dataset.originalFileName?.split('.').pop()?.toUpperCase() || 'CSV'}
                      </span>
                    </td>
                    <td className="p-md text-on-surface-variant text-right">
                      {dataset.totalRecords?.toLocaleString() || '—'}
                    </td>
                    <td className="p-md text-on-surface-variant text-center">—</td>
                    <td className="p-md text-on-surface-variant">{formatDate(dataset.createdAt)}</td>
                    <td className="p-md text-center">{getStatusBadge(dataset.status)}</td>
                    <td className="p-md text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/datasets/${dataset.id}`}
                          aria-label="Preview"
                          className="text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Link>
                        {dataset.status === 'READY' && (
                          <button
                            aria-label="Use for Matching"
                            className="text-secondary hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">play_circle</span>
                          </button>
                        )}
                        <button
                          aria-label="Delete"
                          className="text-error hover:text-on-error-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {datasets.length > 0 && (
          <div className="p-sm border-t border-outline-variant bg-surface-bright flex justify-between items-center">
            <span className="font-body-sm text-body-sm text-on-surface-variant ml-sm">
              Showing 1 to {datasets.length} of {datasets.length} dataset{datasets.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-xs">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-xs rounded hover:bg-surface-container-highest transition-colors text-on-surface-variant disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button className="w-6 h-6 rounded bg-primary-container text-on-primary-container font-label-md text-[11px] flex items-center justify-center">
                {page}
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={datasets.length < 10}
                className="p-xs rounded hover:bg-surface-container-highest transition-colors text-on-surface-variant disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default function DatasetsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <span className="material-symbols-outlined text-[40px] animate-spin">hourglass_empty</span>
        </div>
      }
    >
      <DatasetsPageContent />
    </Suspense>
  );
}
