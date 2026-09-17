/**
 * Dataset Validation Service
 * Validates CSV structure, headers, and records against the dataset contract
 */

import { DATASET_CONTRACT } from '@/lib/config/upload';
import { ParsedRow } from '@/lib/services/csv-parser';

export interface ValidationError {
  type: string;
  message: string;
  rowNumber?: number;
  columnName?: string;
}

/**
 * Validate CSV headers against the dataset contract
 */
export function validateHeaders(headers: string[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (headers.length === 0) {
    errors.push({ type: 'EMPTY_HEADER', message: 'CSV header line is empty' });
    return errors;
  }

  // Upload validation is intentionally permissive. Unknown columns are allowed
  // because matching datasets can have different schemas. We only reject
  // duplicate/blank headers here; field-level validation is applied only to
  // columns that are present and known to the legacy contract.
  const seen = new Set<string>();
  for (const rawHeader of headers) {
    const header = rawHeader.trim();
    if (!header) {
      errors.push({ type: 'EMPTY_COLUMN_NAME', message: 'CSV contains an empty column name' });
      continue;
    }
    if (seen.has(header)) {
      errors.push({ type: 'DUPLICATE_COLUMN', message: `Duplicate column: ${header}`, columnName: header });
    }
    seen.add(header);
  }

  return errors;
}

/**
 * Validate a single record against the dataset contract
 */
export function validateRecord(
  record: ParsedRow,
  rowNumber: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const fieldTypes = DATASET_CONTRACT.FIELD_TYPES as Record<string, string>;

  // Only validate known fields when they are actually present and non-empty.
  // This lets arbitrary CSV schemas be uploaded while retaining useful type
  // checks for the legacy BPS columns.
  for (const [field, fieldType] of Object.entries(fieldTypes)) {
    const value = record[field];
    if (value === undefined || value === null || value.trim() === '') continue;
    const typeError = validateFieldType(field, value, fieldType, rowNumber);
    if (typeError) errors.push(typeError);
  }

  return errors;
}

function validateFieldType(
  field: string,
  value: string,
  type: string | undefined,
  rowNumber: number
): ValidationError | null {
  if (!type) {
    return null;
  }

  const fieldTypes = DATASET_CONTRACT.FIELD_TYPES as Record<string, string>;
  const actualType = (fieldTypes as Record<string, string>)[field] || type;

  switch (actualType) {
    case 'float': {
      // Accept normal decimals and scientific notation (e.g. -7.98e+0).
      // JavaScript Number() also lets us reject NaN/Infinity explicitly.
      const numericValue = Number(value.trim());
      if (!Number.isFinite(numericValue)) {
        // Numeric fields are quality attributes during ingestion. Keep the raw
        // value in raw_data and let transformRowToRecord() persist NULL in the
        // typed column instead of rejecting the entire heterogeneous dataset.
        return null;
      }

      // Coordinates are optional quality attributes. An out-of-range
      // coordinate is normalized to NULL during persistence; rawData always
      // retains the original source value.
      if (field === 'latitude' || field === 'latitude_gc') {
        if (numericValue < -90 || numericValue > 90) return null;
      }
      if (field === 'longitude' || field === 'longitude_gc') {
        if (numericValue < -180 || numericValue > 180) return null;
      }
      break;
    }

    case 'boolean': {
      const normalized = value.trim().toLowerCase();
      // Boolean fields are optional quality attributes during ingestion.
      // Unknown representations are retained in raw_data and become NULL.
      if (!['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(normalized)) return null;
      break;
    }

    case 'date': {
      // Try to parse as ISO date or common formats
      const dateStr = value.trim();
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      break;
    }

    case 'string':
    default:
      // Any non-empty string is valid
      break;
  }

  return null;
}

/**
 * Check for duplicate Idsbr within records
 */
export function validateIdsubrUniqueness(records: ParsedRow[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIdsbr = new Map<string, number>();

  for (let i = 0; i < records.length; i++) {
    const idsbr = records[i].idsbr?.trim();
    if (!idsbr) {
      continue;
    }

    if (seenIdsbr.has(idsbr)) {
      const firstRow = seenIdsbr.get(idsbr)!;
      errors.push({
        type: 'DUPLICATE_IDSBR',
        message: `Duplicate Idsbr: ${idsbr} (also found in row ${firstRow + 1})`,
        rowNumber: i + 2, // +2 because row 1 is header
        columnName: 'idsbr',
      });
    } else {
      seenIdsbr.set(idsbr, i + 2); // +2 for header offset
    }
  }

  return errors;
}

/**
 * Validate all records in a dataset
 */
export function validateAllRecords(records: ParsedRow[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate each record
  for (let i = 0; i < records.length; i++) {
    const recordErrors = validateRecord(records[i], i + 2); // +2 for header
    errors.push(...recordErrors);

    // Stop after first 100 errors to avoid huge error lists
    if (errors.length > 100) {
      errors.push({
        type: 'TOO_MANY_ERRORS',
        message: 'Too many validation errors (stopped after 100)',
      });
      break;
    }
  }

  // Validate Idsbr uniqueness
  const idsubrErrors = validateIdsubrUniqueness(records);
  errors.push(...idsubrErrors);

  return errors;
}
