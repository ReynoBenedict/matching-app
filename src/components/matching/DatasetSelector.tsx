'use client';

import { useEffect, useState } from 'react';

interface Dataset {
  id: number;
  name: string;
  datasetType: string;
  totalRecords: number;
  createdAt: string;
}

interface DatasetSelectorProps {
  title: string;
  selectedId: number | null;
  excludeId?: number | null;
  onSelect: (datasetId: number) => void;
  loading?: boolean;
}

export function DatasetSelector({
  title,
  selectedId,
  excludeId,
  onSelect,
  loading,
}: DatasetSelectorProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const response = await fetch('/api/datasets?status=READY&limit=100');
        const data = await response.json();
        if (data.success) {
          setDatasets(data.data || []);
        } else {
          setError('Failed to fetch datasets');
        }
      } catch (err) {
        setError('Error loading datasets: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setFetching(false);
      }
    }
    fetchDatasets();
  }, []);

  const availableDatasets = excludeId
    ? datasets.filter((d) => d.id !== excludeId)
    : datasets;

  return (
    <div className="space-y-4">
      <h2 className="font-headline-sm text-primary">{title}</h2>

      {error && (
        <div className="text-error text-sm bg-error-container p-3 rounded-lg">
          {error}
        </div>
      )}

      {fetching ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : availableDatasets.length === 0 ? (
        <div className="text-on-surface-variant text-sm bg-surface-container-low p-4 rounded-lg">
          Tidak ada dataset yang siap untuk pencocokan
        </div>
      ) : (
        <div className="grid gap-3">
          {availableDatasets.map((dataset) => (
            <button
              key={dataset.id}
              onClick={() => onSelect(dataset.id)}
              disabled={loading}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedId === dataset.id
                  ? 'border-primary bg-primary-container'
                  : 'border-outline-variant bg-surface hover:border-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-on-surface">{dataset.name}</p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Tipe: {dataset.datasetType} • {dataset.totalRecords} records
                  </p>
                </div>
                {selectedId === dataset.id && (
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
