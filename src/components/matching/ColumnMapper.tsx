'use client';

import { useEffect, useState } from 'react';

interface Column {
  id: number;
  columnName: string;
  dataType: string;
  isRequired: boolean;
}

interface ColumnMapping {
  columnA: string;
  columnB: string;
}

interface ColumnMapperProps {
  datasetAId: number;
  datasetBId: number;
  mappings: ColumnMapping[];
  onUpdateMappings: (mappings: ColumnMapping[]) => void;
}

export function ColumnMapper({
  datasetAId,
  datasetBId,
  mappings,
  onUpdateMappings,
}: ColumnMapperProps) {
  const [columnsA, setColumnsA] = useState<Column[]>([]);
  const [columnsB, setColumnsB] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchColumnsForDataset(datasetId: number): Promise<Column[]> {
      try {
        // First, try to fetch column metadata
        const metaRes = await fetch(`/api/datasets/${datasetId}/columns`);
        
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData.data && metaData.data.length > 0) {
            return metaData.data;
          }
        }

        // Metadata not available or empty, extract from records
        const recordRes = await fetch(`/api/datasets/${datasetId}`);
        if (!recordRes.ok) {
          console.error(`Failed to fetch records for dataset ${datasetId}`);
          return [];
        }

        const recordData = await recordRes.json();
        
        // Extract columns from first record in preview (fallback when metadata is absent)
        if (recordData.data && recordData.data.preview && recordData.data.preview.length > 0) {
          const firstRecord = recordData.data.preview[0];
          // Internal DB fields are never uploaded columns and must not be selectable
          const internalFields = new Set(['id', 'datasetId', 'createdAt', 'updatedAt']);
          const extractedColumns = Object.keys(firstRecord)
            .filter((key) => !internalFields.has(key))
            // Records come back camelCase; the uploaded-column contract is snake_case
            .map((key, idx) => ({
              id: idx,
              columnName: toSnakeCase(key),
              dataType: 'string',
              isRequired: false,
            }));
          return extractedColumns;
        }

        return [];
      } catch (err) {
        console.error(`Error loading columns for dataset ${datasetId}:`, err);
        return [];
      }
    }

    async function loadColumns() {
      try {
        setLoading(true);
        setError(null);

        // Fetch columns for both datasets in parallel
        const [colsA, colsB] = await Promise.all([
          fetchColumnsForDataset(datasetAId),
          fetchColumnsForDataset(datasetBId),
        ]);

        if (colsA.length === 0 || colsB.length === 0) {
          setError('Could not load columns from one or both datasets');
          setLoading(false);
          return;
        }

        setColumnsA(colsA);
        setColumnsB(colsB);
        setLoading(false);
      } catch (err) {
        console.error('Error loading columns:', err);
        setError('Failed to load columns');
        setLoading(false);
      }
    }

    loadColumns();
  }, [datasetAId, datasetBId]);

  const handleAddMapping = () => {
    const newMapping = {
      columnA: columnsA[0]?.columnName || '',
      columnB: columnsB[0]?.columnName || '',
    };
    onUpdateMappings([...mappings, newMapping]);
  };

  const handleRemoveMapping = (index: number) => {
    onUpdateMappings(mappings.filter((_, i) => i !== index));
  };

  const handleUpdateMapping = (
    index: number,
    field: 'columnA' | 'columnB',
    value: string
  ) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [field]: value };
    onUpdateMappings(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && columnsA.length === 0 && columnsB.length === 0) {
    return (
      <div className="text-error text-sm bg-error-container p-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-headline-sm text-primary">Langkah 3: Petakan Kolom</h3>

      {mappings.length === 0 ? (
        <div className="text-on-surface-variant text-sm bg-surface-container-low p-4 rounded-lg">
          Belum ada pemetaan kolom. Klik tombol di bawah untuk menambah.
        </div>
      ) : (
        <div className="space-y-3">
          {mappings.map((mapping, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm font-semibold text-on-surface block mb-1">
                  Dataset Pertama
                </label>
                <select
                  value={mapping.columnA}
                  onChange={(e) =>
                    handleUpdateMapping(idx, 'columnA', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">Pilih kolom...</option>
                  {columnsA.map((col) => (
                    <option key={col.columnName} value={col.columnName}>
                      {col.columnName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-on-surface-variant">↔</div>

              <div className="flex-1">
                <label className="text-sm font-semibold text-on-surface block mb-1">
                  Dataset Kedua
                </label>
                <select
                  value={mapping.columnB}
                  onChange={(e) =>
                    handleUpdateMapping(idx, 'columnB', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">Pilih kolom...</option>
                  {columnsB.map((col) => (
                    <option key={col.columnName} value={col.columnName}>
                      {col.columnName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleRemoveMapping(idx)}
                className="p-2 text-error hover:bg-error-container rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleAddMapping}
        disabled={columnsA.length === 0 || columnsB.length === 0}
        className="w-full border border-primary text-primary py-2 rounded-lg font-label-md hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        + Tambah Pemetaan Kolom
      </button>
    </div>
  );
}

/**
 * Convert a camelCase record key back to the snake_case uploaded-column contract.
 */
function toSnakeCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}
