/**
 * Dataset Upload Service
 * Orchestrates the complete upload pipeline:
 * Upload → Parsing → Validation → Persistence → READY
 */

import { getDatabase } from '@/lib/db';
import { datasets, datasetColumns, datasetRecords } from '@/lib/db/schema';
import { parseCSV } from '@/lib/services/csv-parser';
import {
  validateHeaders,
  validateAllRecords,
  ValidationError,
} from '@/lib/services/validation';
import { DATASET_CONTRACT, UPLOAD_CONFIG } from '@/lib/config/upload';
import { eq, sql } from 'drizzle-orm';

export interface UploadResult {
  success: boolean;
  datasetId?: number;
  status?: string;
  totalRecords?: number;
  validRecords?: number;
  errors?: ValidationError[];
  message?: string;
}

/**
 * Process an uploaded CSV file and persist to database
 * Uses transactions to ensure atomicity
 */
export async function uploadDataset(
  csvContent: string,
  datasetName: string,
  datasetType: string,
  originalFileName: string,
  uploadedBy: number
): Promise<UploadResult> {
  const db = getDatabase();

  try {
    // Step 1: Create dataset metadata with UPLOADING status
    const datasetResult = await db
      .insert(datasets)
      .values({
        name: datasetName,
        datasetType,
        originalFileName,
        source: datasetType,
        status: 'UPLOADING',
        uploadedBy,
        totalRecords: 0,
        validRecords: 0,
      })
      .returning({ id: datasets.id });

    if (!datasetResult[0]) {
      return {
        success: false,
        message: 'Failed to create dataset metadata',
      };
    }

    const datasetId = datasetResult[0].id;

    try {
      // Step 2: Update status to VALIDATING
      await db
        .update(datasets)
        .set({ status: 'VALIDATING' })
        .where(sql`id = ${datasetId}`);

      // Step 3: Parse CSV
      const parseResult = parseCSV(csvContent);

      // Step 4: Validate CSV structure. Unknown/missing legacy columns are allowed.
      if (parseResult.rows.length > UPLOAD_CONFIG.MAX_RECORDS_PER_DATASET) {
        await markDatasetFailed(datasetId, `Dataset exceeds maximum of ${UPLOAD_CONFIG.MAX_RECORDS_PER_DATASET.toLocaleString()} records`);
        return { success: false, datasetId, status: 'FAILED', message: `Maximum ${UPLOAD_CONFIG.MAX_RECORDS_PER_DATASET.toLocaleString()} records allowed` };
      }
      const headerErrors = validateHeaders(parseResult.headers);
      if (headerErrors.length > 0) {
        await markDatasetFailed(
          datasetId,
          `Header validation failed: ${headerErrors[0].message}`
        );
        return {
          success: false,
          datasetId,
          status: 'FAILED',
          errors: headerErrors,
          message: 'CSV headers are invalid',
        };
      }

      // Step 5: Create column metadata
      const columnMetadata = createColumnMetadata(parseResult.headers);
      for (const col of columnMetadata) {
        await db.insert(datasetColumns).values({
          datasetId,
          columnName: col.columnName,
          dataType: col.dataType,
          isRequired: col.isRequired,
          isPrimaryKey: col.isPrimaryKey,
          columnOrder: col.columnOrder,
        });
      }

      // Step 6: Validate all records
      const recordErrors = validateAllRecords(parseResult.rows);
      if (recordErrors.length > 0) {
        await markDatasetFailed(
          datasetId,
          `Record validation failed: ${recordErrors[0].message}`
        );
        return {
          success: false,
          datasetId,
          status: 'FAILED',
          errors: recordErrors,
          message: 'CSV records contain invalid values',
        };
      }

      // Step 7: Transform and persist records
      const transformedRecords = parseResult.rows.map((row, index) =>
        transformRowToRecord(row, datasetId, index)
      );

      // Insert in bounded batches. A 200MB CSV can contain hundreds of
      // thousands of rows; inserting the entire file in one SQL statement can
      // exceed PostgreSQL parameter/query limits.
      const batchSize = 1000;
      for (let i = 0; i < transformedRecords.length; i += batchSize) {
        const batch = transformedRecords.slice(i, i + batchSize);
        if (batch.length > 0) {
          await db.insert(datasetRecords).values(batch);
        }
      }

      // Step 8: Update dataset status to READY
      await db
        .update(datasets)
        .set({
          status: 'READY',
          totalRecords: parseResult.rows.length,
          validRecords: parseResult.rows.length,
        })
        .where(sql`id = ${datasetId}`);

      return {
        success: true,
        datasetId,
        status: 'READY',
        totalRecords: parseResult.rows.length,
        validRecords: parseResult.rows.length,
        message: 'Dataset uploaded and validated successfully',
      };
    } catch (error) {
      // If any persistence error occurs, mark as FAILED
      const errorMessage = describePersistenceError(error);
      // Remove any partially persisted rows/column metadata. Keep the dataset
      // metadata as FAILED so the user can see why the upload failed.
      try {
        await db.delete(datasetRecords).where(eq(datasetRecords.datasetId, datasetId));
        await db.delete(datasetColumns).where(eq(datasetColumns.datasetId, datasetId));
      } catch (cleanupError) {
        console.error(`Failed to clean up failed dataset ${datasetId}`, cleanupError);
      }
      await markDatasetFailed(datasetId, `Persistence error: ${errorMessage}`);

      return {
        success: false,
        datasetId,
        status: 'FAILED',
        message: 'Failed to persist dataset',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

function describePersistenceError(error: unknown): string {
  if (!(error instanceof Error)) return 'Unknown database error';
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error && cause.message) {
    return `${error.message}; cause: ${cause.message}`;
  }
  if (cause && typeof cause === 'object' && 'message' in cause) {
    return `${error.message}; cause: ${String((cause as { message?: unknown }).message)}`;
  }
  return error.message || 'Unknown database error';
}

/**
 * Mark a dataset as FAILED with a reason
 */
async function markDatasetFailed(datasetId: number, reason: string) {
  const db = getDatabase();
  try {
    await db
      .update(datasets)
      .set({
        status: 'FAILED',
        failureReason: reason,
      })
      .where(sql`id = ${datasetId}`);
  } catch (error) {
    console.error(`Failed to mark dataset ${datasetId} as failed`, error);
  }
}

/**
 * Create column metadata from CSV headers
 */
function createColumnMetadata(
  headers: string[]
): Array<{
  columnName: string;
  dataType: string;
  isRequired: boolean;
  isPrimaryKey: boolean;
  columnOrder: number;
}> {
  const fieldTypes = DATASET_CONTRACT.FIELD_TYPES as Record<string, string>;

  return headers.map((header, index) => {
    const isRequired = DATASET_CONTRACT.REQUIRED_FIELDS.includes(header);
    const isPrimaryKey = header === 'idsbr';
    const dataType = (fieldTypes as Record<string, string>)[header] || 'string';

    return {
      columnName: header,
      dataType,
      isRequired,
      isPrimaryKey,
      columnOrder: index,
    };
  });
}

/**
 * Transform a CSV row into a dataset_records insert value
 */
function transformRowToRecord(
  row: { [key: string]: string },
  datasetId: number,
  rowIndex: number
) {
  const value = (key: string) => {
    const v = row[key];
    return v === undefined || v === null || v.trim() === '' ? null : v.trim();
  };
  const num = (key: string) => {
    const v = value(key);
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n.toString() : null;
  };

  const coordinate = (key: 'latitude' | 'longitude' | 'latitude_gc' | 'longitude_gc') => {
    const raw = value(key);
    if (raw === null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if ((key === 'latitude' || key === 'latitude_gc') && (n < -90 || n > 90)) return null;
    if ((key === 'longitude' || key === 'longitude_gc') && (n < -180 || n > 180)) return null;
    return n.toString();
  };
  const date = value('history_ref_profiling_id');
  const parsedDate = date ? new Date(date) : new Date();

  return {
    datasetId,
    rawData: row,
    // Keep legacy columns populated for backwards compatibility. The complete
    // original row is always available in rawData for flexible schemas.
    idsbr: value('idsbr') || `row-${datasetId}-${rowIndex + 1}`,
    namaUsaha: value('nama_usaha') || value('nama') || '',
    alamatUsaha: value('alamat_usaha') || value('alamat') || '',
    kodeWilayah: value('kode_wilayah') || '',
    kdprov: value('kdprov') || '',
    kdkab: value('kdkab') || '',
    kdkec: value('kdkec') || '',
    kddesa: value('kddesa') || '',
    nmprov: value('nmprov') || '',
    nmkab: value('nmkab') || '',
    nmkec: value('nmkec') || '',
    nmdesa: value('nmdesa') || '',
    perusahaanId: value('perusahaan_id') || '',
    statusPerusahaan: value('status_perusahaan') || '',
    skorKalo: value('skor_kalo'),
    kegiatanUsaha: value('kegiatan_usaha'),
    rankNama: value('rank_nama'),
    rankAlamat: value('rank_alamat'),
    historyRefProfilingId: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
    skalaUsaha: value('skala_usaha'),
    sumberData: value('sumber_data') || '',
    latitude: coordinate('latitude'),
    longitude: coordinate('longitude'),
    latlongStatus: value('latlong_status') || '',
    gcid: value('gcid') || '',
    gcsResult: num('gcs_result'),
    allowCancel: parseBooleanValue(value('allow_cancel') || ''),
    allowEdit: parseBooleanValue(value('allow_edit') || ''),
    allowFlagging: parseBooleanValue(value('allow_flagging') || ''),
    latitudeGc: coordinate('latitude_gc'),
    longitudeGc: coordinate('longitude_gc'),
    latlongStatusGc: value('latlong_status_gc') || '',
    gcUsername: value('gc_username') || '',
    namaUsahaGc: value('nama_usaha_gc'),
    alamatUsahaGc: value('alamat_usaha_gc'),
  };
}

/**
 * Parse boolean value from CSV string
 */
function parseBooleanValue(value: string): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return null;
}
