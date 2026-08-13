/**
 * CSV Parser Service
 * Handles parsing CSV files into structured data
 * Follows RFC 4180 CSV format specification
 */

export interface ParsedRow {
  [key: string]: string;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
}

/**
 * Parse CSV content into headers and rows
 * Handles:
 * - Headers in first line
 * - Quoted values with escaped quotes
 * - Commas inside quoted values
 * - Various line endings (CRLF, LF)
 * - UTF-8 encoding
 */
export function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header line
  const headers = parseCSVLine(lines[0]);

  if (headers.length === 0) {
    throw new Error('CSV header line is empty');
  }

  // Check for duplicate headers
  const uniqueHeaders = new Set(headers);
  if (uniqueHeaders.size !== headers.length) {
    throw new Error('CSV contains duplicate column headers');
  }

  // Parse data rows
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      continue; // Skip empty lines
    }

    const values = parseCSVLine(line);

    if (values.length !== headers.length) {
      throw new Error(
        `Row ${i + 1} has ${values.length} columns, expected ${headers.length}`
      );
    }

    const row: ParsedRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }

    rows.push(row);
  }

  if (rows.length === 0) {
    throw new Error('CSV file contains only headers, no data rows');
  }

  return { headers, rows };
}

/**
 * Parse a single CSV line following RFC 4180
 * Handles quoted values and escaped quotes
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted value
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Unquoted comma - field separator
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  values.push(current.trim());

  return values;
}
