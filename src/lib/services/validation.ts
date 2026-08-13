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
  const allContractFields = [
    ...DATASET_CONTRACT.REQUIRED_FIELDS,
    ...DATASET_CONTRACT.OPTIONAL_FIELDS,
  ];

  // Check for unknown columns
  for (const header of headers) {
    if (!allContractFields.includes(header)) {
      errors.push({
        type: 'UNKNOWN_COLUMN',
        message: `Unknown column: ${header}`,
        columnName: header,
      });
    }
  }

  // Check for missing required fields
  for (const field of DATASET_CONTRACT.REQUIRED_FIELDS) {
    if (!headers.includes(field)) {
      errors.push({
        type: 'MISSING_REQUIRED_FIELD',
        message: `Missing required field: ${field}`,
        columnName: field,
      });
    }
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

  // Validate required fields
  for (const field of DATASET_CONTRACT.REQUIRED_FIELDS) {
    const value = record[field];

    if (value === undefined || value === null || value.trim() === '') {
      errors.push({
        type: 'MISSING_REQUIRED_VALUE',
        message: `Required field is empty: ${field}`,
        rowNumber,
        columnName: field,
      });
      continue;
    }

    // Validate by type
    const fieldType = (fieldTypes as Record<string, string>)[field];
    const typeError = validateFieldType(field, value, fieldType, rowNumber);
    if (typeError) {
      errors.push(typeError);
    }
  }

  // Validate optional fields (only if present and non-empty)
  for (const field of DATASET_CONTRACT.OPTIONAL_FIELDS) {
    const value = record[field];

    // Optional fields can be empty
    if (!value || value.trim() === '') {
      continue;
    }

    const fieldType = (fieldTypes as Record<string, string>)[field];
    const typeError = validateFieldType(field, value, fieldType, rowNumber);
    if (typeError) {
      errors.push(typeError);
    }
  }

  return errors;
}

/**
 * Validate field type
 */
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
      if (!/^-?\d+(\.\d+)?$/.test(value.trim())) {
        return {
          type: 'INVALID_FLOAT',
          message: `Invalid numeric value for ${field}: ${value}`,
          rowNumber,
          columnName: field,
        };
      }
      break;
    }

    case 'boolean': {
      const normalized = value.trim().toLowerCase();
      if (
        !['true', 'false', '1', '0', 'yes', 'no'].includes(normalized)
      ) {
        return {
          type: 'INVALID_BOOLEAN',
          message: `Invalid boolean value for ${field}: ${value}`,
          rowNumber,
          columnName: field,
        };
      }
      break;
    }

    case 'date': {
      // Try to parse as ISO date or common formats
      const dateStr = value.trim();
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return {
          type: 'INVALID_DATE',
          message: `Invalid date value for ${field}: ${value}`,
          rowNumber,
          columnName: field,
        };
      }
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
