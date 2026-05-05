/**
 * Minimal RFC 4180-compliant CSV parser.
 *
 * Handles:
 *   - Quoted fields with embedded commas: `"Smith, John",30`
 *   - Escaped quotes inside quoted fields: `"She said ""hi"""`
 *   - CRLF and LF line endings
 *   - Leading BOM (Excel adds one)
 *   - Trailing whitespace on rows
 *
 * Does NOT handle:
 *   - Multi-line values (newline inside quoted field) — rare in school data,
 *     and supporting it makes the parser much more complex
 *   - Different delimiters (always comma)
 *
 * Returns rows as string[][]. The first row is treated as headers by the
 * caller, not by this function.
 */
export function parseCSV(input: string): string[][] {
  // Strip leading BOM that Excel/Google Sheets often add
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  // Normalize line endings to \n
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        // Escaped quote: "" → "
        currentField += '"';
        i++; // skip the second quote
      } else if (char === '"') {
        // Closing quote
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"' && currentField === '') {
        // Opening quote (only valid at start of field)
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        // Skip empty trailing rows
        if (currentRow.some((f) => f.trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  // Flush any remaining field/row (file without trailing newline)
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Convert parsed CSV rows into objects keyed by header.
 *
 * Headers are normalized: lowercased, whitespace trimmed, spaces → underscores.
 * "Display Name" → "display_name", "Class ID" → "class_id"
 *
 * Rows shorter than headers get undefined for missing fields.
 * Rows longer than headers have extra fields dropped.
 */
export function csvToObjects(
  rows: string[][]
): { headers: string[]; data: Record<string, string>[] } {
  if (rows.length === 0) {
    return { headers: [], data: [] };
  }

  const headers = rows[0].map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, '_')
  );

  const data: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = (row[j] ?? '').trim();
    }
    data.push(obj);
  }

  return { headers, data };
}

/**
 * Combined helper: parse a CSV string and return objects keyed by normalized headers.
 */
export function parseCSVAsObjects(input: string): {
  headers: string[];
  data: Record<string, string>[];
} {
  return csvToObjects(parseCSV(input));
}

/**
 * Build a CSV string from rows of values.
 * Quotes any field that contains a comma, quote, or newline.
 *
 * Used by API routes that return downloadable CSV templates.
 */
export function buildCSV(headers: string[], rows: string[][]): string {
  const escape = (val: string): string => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  const lines: string[] = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return lines.join('\n');
}
