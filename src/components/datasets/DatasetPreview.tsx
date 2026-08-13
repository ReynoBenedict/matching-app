'use client';

interface DatasetRecord {
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface DatasetPreviewProps {
  records: DatasetRecord[];
  totalCount: number;
  isLoading?: boolean;
  maxVisibleColumns?: number;
}

export function DatasetPreview({
  records,
  totalCount,
  isLoading = false,
  maxVisibleColumns = 6,
}: DatasetPreviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-md">
        <div className="h-4 bg-outline-variant rounded animate-pulse w-32"></div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <div className="h-20 bg-outline-variant/50 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="bg-surface-container-low rounded-lg border border-outline-variant p-lg text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Tidak ada data untuk ditampilkan
        </p>
      </div>
    );
  }

  // Get visible columns (prioritize important fields)
  const importantFields = ['idsbr', 'namaUsaha', 'alamatUsaha', 'kodeWilayah', 'nmprov', 'nmkab'];
  const allKeys = Object.keys(records[0]).filter((k) => k !== 'id');
  const visibleFields = importantFields.filter((f) => allKeys.includes(f));
  const remainingFields = allKeys
    .filter((f) => !importantFields.includes(f))
    .slice(0, maxVisibleColumns - visibleFields.length);
  const columns = [...visibleFields, ...remainingFields];

  const formatValue = (value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  const formatColumnName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <p className="font-label-md text-label-md text-on-surface-variant">
          Menampilkan {records.length} dari {totalCount} record
          {columns.length < allKeys.length && (
            <span className="text-on-surface-variant ml-md">
              ({allKeys.length} kolom total, menampilkan {columns.length})
            </span>
          )}
        </p>
      </div>

      <div className="overflow-x-auto bg-surface-container-lowest border border-outline-variant rounded-lg">
        <table className="w-full min-w-full">
          <thead className="bg-surface-container border-b border-outline-variant sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-md py-md text-left font-label-md text-label-md text-on-surface-variant whitespace-nowrap"
                >
                  {formatColumnName(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr
                key={String(record.id || idx)}
                className="border-b border-outline-variant hover:bg-surface-container transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={`${record.id || idx}-${col}`}
                    className="px-md py-md font-data-tabular text-data-tabular text-on-surface break-words max-w-xs"
                  >
                    {formatValue(record[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {columns.length < allKeys.length && (
        <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
          Menampilkan {columns.length} dari {allKeys.length} kolom. Gunakan scroll horizontal untuk melihat lebih banyak.
        </p>
      )}
    </div>
  );
}
