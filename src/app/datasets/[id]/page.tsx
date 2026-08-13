'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout';

interface DatasetDetail {
  id: number;
  name: string;
  datasetType: string;
  originalFileName: string | null;
  source: string;
  status: 'UPLOADING' | 'VALIDATING' | 'READY' | 'FAILED';
  totalRecords: number | null;
  validRecords: number | null;
  uploadedBy: number | null;
  createdAt: string;
  updatedAt: string;
  failureReason: string | null;
  uploader: {
    id: number;
    fullName: string;
    email: string;
    username: string;
  } | null;
  preview: Record<string, unknown>[];
  previewCount: number;
}

export default function DatasetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const datasetId = params.id as string;

  const [dataset, setDataset] = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!datasetId) return;

    const fetchDatasetDetail = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/datasets/${datasetId}`);

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          if (response.status === 404) {
            setError('Dataset tidak ditemukan');
            return;
          }
          throw new Error('Failed to fetch dataset');
        }

        const data = await response.json();
        setDataset(data.data);
      } catch (err) {
        console.error('Error fetching dataset:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dataset');
      } finally {
        setLoading(false);
      }
    };

    fetchDatasetDetail();
  }, [datasetId, router]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const datasetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DB_KENDEDES: 'Database Kendedes',
      DIR_PAJAK: 'Direktori Pajak',
      OSS_BADAN_USAHA: 'OSS - Badan Usaha',
      OSS_PERORANGAN: 'OSS - Perorangan',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      READY: (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          Siap Digunakan
        </span>
      ),
      UPLOADING: (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-container-high text-primary">
          Mengunggah
        </span>
      ),
      VALIDATING: (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-container-high text-primary">
          Memvalidasi
        </span>
      ),
      FAILED: (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-error-container text-on-error-container">
          Gagal
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || badges.READY;
  };

  return (
    <AuthenticatedLayout pageTitle="Detail Dataset">
      {/* Breadcrumbs */}
      <Link
        href="/datasets"
        className="inline-flex items-center gap-xs text-primary hover:text-primary-container transition-colors font-label-md mb-md"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Manajemen Dataset
      </Link>

      <div className="mb-lg flex items-center text-sm text-on-surface-variant font-label-md">
        <Link href="/datasets" className="hover:text-primary transition-colors">
          Manajemen Dataset
        </Link>
        <span className="mx-xs material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-primary font-bold">{dataset?.name || 'Detail'}</span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-container border border-error rounded-xl p-lg mb-lg">
          <p className="font-body-md text-on-error-container">{error}</p>
          <Link href="/datasets" className="inline-block mt-md text-on-error-container hover:underline font-label-md">
            Kembali ke Daftar Dataset
          </Link>
        </div>
      )}

      {loading ? (
        <div className="py-xl text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[40px] animate-spin inline-block">hourglass_empty</span>
          <p className="font-body-md mt-sm">Memuat detail dataset...</p>
        </div>
      ) : dataset ? (
        <>
          {/* Page Header */}
          <div className="mb-xl flex justify-between items-end border-b border-outline-variant pb-md">
            <div>
              <h1 className="font-headline-lg font-bold text-on-background mb-xs">Detail Dataset</h1>
              <p className="text-on-surface-variant font-body-md">Menampilkan informasi metadata dan sampel pratinjau data.</p>
            </div>
            <div className="flex gap-sm">
              <button className="bg-surface text-primary border border-primary px-md py-sm rounded font-label-md hover:bg-surface-container-low transition-colors flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Unduh Asli
              </button>
            </div>
          </div>

          {/* Bento Grid Layout for Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-xl">
            {/* Primary Info Card */}
            <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl p-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-md mb-md">
                <div className="p-sm bg-primary-container text-on-primary-container rounded-lg">
                  <span className="material-symbols-outlined text-[32px]">description</span>
                </div>
                <div>
                  <h3 className="font-headline-sm font-bold text-on-background">{dataset.name}</h3>
                  <div className="flex gap-sm mt-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-container-high text-primary">
                      {dataset.originalFileName?.split('.').pop()?.toUpperCase() || 'CSV'}
                    </span>
                    {getStatusBadge(dataset.status)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md mt-lg border-t border-outline-variant pt-md">
                <div>
                  <p className="text-on-surface-variant font-label-md mb-xs">Sumber</p>
                  <p className="font-body-md font-semibold">{dataset.source}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-label-md mb-xs">Jumlah Baris</p>
                  <p className="font-body-md font-semibold">{dataset.totalRecords?.toLocaleString() || '—'}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-label-md mb-xs">Tipe Dataset</p>
                  <p className="font-body-md font-semibold">{datasetTypeLabel(dataset.datasetType)}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-label-md mb-xs">Tanggal Unggah</p>
                  <p className="font-body-md font-semibold">{formatDate(dataset.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Secondary Info Card */}
            <div className="bg-surface border border-outline-variant rounded-xl p-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h4 className="font-label-md text-on-surface-variant uppercase tracking-wider mb-sm">Status Kualitas Data</h4>
                <div className="mb-md">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="font-body-sm">Kelengkapan</span>
                    <span className="font-label-md text-primary">
                      {dataset.validRecords && dataset.totalRecords
                        ? Math.round((dataset.validRecords / dataset.totalRecords) * 100)
                        : '—'}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-secondary h-full"
                      style={{
                        width: `${
                          dataset.validRecords && dataset.totalRecords
                            ? (dataset.validRecords / dataset.totalRecords) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              {dataset.uploader && (
                <div className="mt-md pt-md border-t border-outline-variant">
                  <p className="font-body-sm text-on-surface-variant">
                    Diunggah oleh: <span className="font-semibold text-on-background">{dataset.uploader.fullName}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Failure Reason */}
          {dataset.status === 'FAILED' && dataset.failureReason && (
            <div className="bg-error-container border border-error rounded-xl p-lg mb-lg">
              <h3 className="font-headline-sm text-on-error-container mb-md">Alasan Gagal</h3>
              <p className="font-body-md text-on-error-container">{dataset.failureReason}</p>
              <Link href="/datasets/upload" className="inline-block mt-md text-on-error-container hover:underline font-label-md">
                Coba Unggah Dataset Lagi
              </Link>
            </div>
          )}

          {/* Data Preview */}
          {dataset.status === 'READY' && dataset.preview.length > 0 && (
            <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                <h3 className="font-headline-md font-semibold text-on-background">Pratinjau Data (Sampel)</h3>
                <span className="font-body-sm text-on-surface-variant">
                  Menampilkan {dataset.preview.length} dari {dataset.totalRecords?.toLocaleString() || 0} baris
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-data-tabular">
                  <thead className="bg-surface-container-low border-b border-outline-variant">
                    <tr>
                      {dataset.preview.length > 0 &&
                        Object.keys(dataset.preview[0]).map((key) => (
                          <th key={key} className="p-md font-label-md text-on-surface-variant whitespace-nowrap border-r border-outline-variant/30">
                            {key}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50">
                    {dataset.preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-lowest transition-colors group">
                        {Object.values(row).map((value, colIdx) => (
                          <td
                            key={colIdx}
                            className="p-md border-r border-outline-variant/30 text-on-surface-variant group-hover:text-on-background truncate max-w-[200px]"
                            title={String(value)}
                          >
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-md mt-xl pt-lg border-t border-outline-variant">
            <Link
              href="/datasets"
              className="flex-1 text-center px-lg py-sm bg-surface-container text-on-surface border border-outline-variant rounded-lg font-label-md hover:bg-surface-container-high transition-colors"
            >
              Kembali ke Dataset
            </Link>
            {dataset.status === 'FAILED' && (
              <Link
                href="/datasets/upload"
                className="flex-1 text-center px-lg py-sm bg-primary text-on-primary rounded-lg font-label-md hover:opacity-90 transition-opacity"
              >
                Coba Unggah Lagi
              </Link>
            )}
          </div>
        </>
      ) : null}
    </AuthenticatedLayout>
  );
}
