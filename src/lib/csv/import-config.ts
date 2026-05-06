import type { FieldConfig } from './matcher';

/**
 * Per-dataset import configuration.
 *
 * Each dataset (users, schedules, subjects, classes) has one of these.
 * The shared <CsvImportDialog> reads it to know:
 *   - What fields exist and which are required
 *   - How to normalize each cell value
 *   - Where to POST the result
 */
export interface ImportConfig<TRow extends Record<string, unknown> = Record<string, unknown>> {
  /** Display label for the import dialog title and headings. */
  datasetLabel: string;
  /** Plural noun for messages ("Imported 5 students"). */
  itemNoun: { singular: string; plural: string };
  /** Field definitions — drives both auto-mapping and the manual UI. */
  fields: FieldConfig[];
  /**
   * Normalize a row from {sourceHeader → cellValue} format to the canonical
   * shape ready for the API. This is where day-of-week strings become 'mon',
   * times become '08:00', etc.
   *
   * Returns either a normalized row object, or a validation error message.
   * Errors here are pre-server validation — they catch obvious problems
   * (invalid time format, unknown role) before sending to the API.
   *
   * @param raw  Object with canonical field keys mapped to cell values
   *             (the raw mapping has already been applied; this gets
   *             the values lined up under the right field names).
   */
  normalizeRow: (raw: Record<string, string>) => RowNormalizationResult<TRow>;
  /** API endpoint that accepts the normalized rows. */
  apiEndpoint: string;
  /**
   * Optional CSV template content. Used by the "Download template" button.
   * Plain CSV string starting with the header row.
   */
  templateCsv?: string;
}

export type RowNormalizationResult<TRow> =
  | { ok: true; row: TRow }
  | { ok: false; error: string };

/** Server response from any of the import endpoints. */
export interface ImportApiResponse {
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
}
