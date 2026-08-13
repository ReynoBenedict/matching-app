'use client';

import Link from 'next/link';
import { StatusBadge } from './StatusBadge';

export interface Dataset {
  id: number;
  name: string;
  datasetType: string;
  originalFileName: string | null;
  status: 'UPLOADING' | 'VALIDATING' | 'READY' | 'FAILED';
  totalRecords: number | null;
  validRecords: number | null;
  uploadedBy: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  failureReason: string | null;
}

interface DatasetListTableProps {
  datasets: Dataset[];
  isLoading?: boolean;
}

export function DatasetListTable({
  datasets,
  isLoading = false,
}: DatasetListTableProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-container">
            <tr className="border-b border-outline-variant">
              <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface-variant">
                Nama Dataset
              </th>
              <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface-variant">
                Tipe
              </th>
              <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface-variant">
                Status
              </th>
              <th className="px-lg py-md text-right font-label-md text-label-md text-on-surface-variant">
                Record
              </th>
              <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface-variant">
                Tanggal Upload
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-outline-variant">
                <td className="px-lg py-md">
                  <div className="h-4 bg-outline-variant rounded animate-pulse w-48"></div>
                </td>
                <td className="px-lg py-md">
                  <div className="h-4 bg-outline-variant rounded animate-pulse w-32"></div>
                </td>
                <td className="px-lg py-md">
                  <div className="h-4 bg-outline-variant rounded animate-pulse w-20"></div>
                </td>
                <td className="px-lg py-md text-right">
                  <div className="h-4 bg-outline-variant rounded animate-pulse w-16 ml-auto"></div>
                </td>
                <td className="px-lg py-md">
                  <div className="h-4 bg-outline-variant rounded animate-pulse w-40"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-surface-container">
          <tr className="border-b border-outline-variant">
            <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface-variant">
              Nama Dataset
            </th>
            <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface-variant">
              Tipe
            </th>
            <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface-variant">
              Status
            </th>
            <th className="px-lg py-md text-right font-label-md text-label-md text-on-surface-variant">
              Record
            </th>
            <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface-variant">
              Tanggal Upload
            </th>
            <th className="px-lg py-md text-center font-label-md text-label-md text-on-surface-variant">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((dataset) => (
            <tr
              key={dataset.id}
              className="border-b border-outline-variant hover:bg-surface-container transition-colors"
            >
              <td className="px-lg py-md">
                <p className="font-body-md text-body-md text-on-surface font-semibold">
                  {dataset.name}
                </p>
                {dataset.originalFileName && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {dataset.originalFileName}
                  </p>
                )}
              </td>
              <td className="px-lg py-md">
                <p className="font-body-md text-body-md text-on-surface">
                  {datasetTypeLabel(dataset.datasetType)}
                </p>
              </td>
              <td className="px-lg py-md">
                <StatusBadge status={dataset.status} />
              </td>
              <td className="px-lg py-md text-right">
                <p className="font-body-md text-body-md text-on-surface">
                  {dataset.totalRecords ?? 0}
                </p>
                {dataset.validRecords !== null && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    ✓ {dataset.validRecords}
                  </p>
                )}
              </td>
              <td className="px-lg py-md">
                <p className="font-body-md text-body-md text-on-surface">
                  {formatDate(dataset.createdAt)}
                </p>
              </td>
              <td className="px-lg py-md text-center">
                <Link
                  href={`/datasets/${dataset.id}`}
                  className="text-primary hover:underline font-label-md text-label-md inline-block px-md py-sm rounded hover:bg-primary-container/20 transition-colors"
                >
                  Lihat
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
