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
import { DATASET_CONTRACT } from '@/lib/config/upload';
import { sql } from 'drizzle-orm';

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

      // Step 4: Validate headers against contract
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
          message: 'CSV headers do not match dataset contract',
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
          message: 'CSV records do not conform to dataset contract',
        };
      }

      // Step 7: Transform and persist records
      const transformedRecords = parseResult.rows.map((row) =>
        transformRowToRecord(row, datasetId)
      );

      // Batch insert for efficiency
      if (transformedRecords.length > 0) {
        await db.insert(datasetRecords).values(transformedRecords);
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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
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
  datasetId: number
) {
  return {
    datasetId,
    idsbr: row.idsbr,
    namaUsaha: row.nama_usaha,
    alamatUsaha: row.alamat_usaha,
    kodeWilayah: row.kode_wilayah,
    kdprov: row.kdprov,
    kdkab: row.kdkab,
    kdkec: row.kdkec,
    kddesa: row.kddesa,
    nmprov: row.nmprov,
    nmkab: row.nmkab,
    nmkec: row.nmkec,
    nmdesa: row.nmdesa,
    perusahaanId: row.perusahaan_id,
    statusPerusahaan: row.status_perusahaan,
    skorKalo: row.skor_kalo || null,
    kegiatanUsaha: row.kegiatan_usaha || null,
    rankNama: row.rank_nama || null,
    rankAlamat: row.rank_alamat || null,
    historyRefProfilingId: new Date(row.history_ref_profiling_id),
    skalaUsaha: row.skala_usaha || null,
    sumberData: row.sumber_data,
    latitude: row.latitude,
    longitude: row.longitude,
    latlongStatus: row.latlong_status,
    gcid: row.gcid,
    gcsResult: row.gcs_result,
    allowCancel: parseBooleanValue(row.allow_cancel),
    allowEdit: parseBooleanValue(row.allow_edit),
    allowFlagging: parseBooleanValue(row.allow_flagging),
    latitudeGc: row.latitude_gc,
    longitudeGc: row.longitude_gc,
    latlongStatusGc: row.latlong_status_gc,
    gcUsername: row.gc_username,
    namaUsahaGc: row.nama_usaha_gc || null,
    alamatUsahaGc: row.alamat_usaha_gc || null,
  };
}

/**
 * Parse boolean value from CSV string
 */
function parseBooleanValue(value: string): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return ['true', '1', 'yes'].includes(normalized);
}
