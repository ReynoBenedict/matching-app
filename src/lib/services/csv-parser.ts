/** RFC 4180 compatible CSV parser. Supports quoted commas, escaped quotes and newlines. */
export interface ParsedRow { [key: string]: string; }
export interface ParseResult { headers: string[]; rows: ParsedRow[]; }

export function parseCSV(content: string): ParseResult {
  if (!content || !content.trim()) throw new Error('CSV file is empty');
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') { field += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      row.push(field.trim()); field = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(field.trim()); field = '';
      if (row.some(v => v !== '')) records.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  if (inQuotes) throw new Error('CSV contains an unterminated quoted field');
  row.push(field.trim());
  if (row.some(v => v !== '')) records.push(row);
  if (!records.length) throw new Error('CSV file is empty');

  const headers = records[0].map(h => h.replace(/^\uFEFF/, '').trim());
  if (!headers.length || headers.some(h => !h)) throw new Error('CSV contains an empty column name');
  if (new Set(headers).size !== headers.length) throw new Error('CSV contains duplicate column headers');

  const rows: ParsedRow[] = [];
  for (let i = 1; i < records.length; i++) {
    const values = records[i];
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
    }
    const parsed: ParsedRow = {};
    headers.forEach((header, index) => { parsed[header] = values[index]; });
    rows.push(parsed);
  }
  if (!rows.length) throw new Error('CSV file contains only headers, no data rows');
  return { headers, rows };
}
