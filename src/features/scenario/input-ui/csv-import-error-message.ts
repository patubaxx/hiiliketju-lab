import type { ParseTimeSeriesCsvError } from "@/features/scenario/input-ui/parse-time-series-csv";

export type CsvImportMessageKey = string;

/** Maps parser errors to i18n keys and optional template variables for `t()`. */
export function csvImportErrorToMessage(
  error: ParseTimeSeriesCsvError,
): { key: CsvImportMessageKey; vars?: Record<string, string | number> } {
  switch (error.code) {
    case "empty_file":
      return { key: "csvImport.errors.emptyFile" };
    case "no_data_rows":
      return { key: "csvImport.errors.noDataRows" };
    case "invalid_first_data_row":
      return { key: "csvImport.errors.invalidFirstRow", vars: { line: error.line } };
    case "mixed_row_formats":
      return { key: "csvImport.errors.mixedFormats", vars: { line: error.line } };
    case "invalid_number":
      return { key: "csvImport.errors.invalidNumber", vars: { line: error.line } };
    case "invalid_timestamp":
      return { key: "csvImport.errors.invalidTimestamp", vars: { line: error.line } };
    case "hourly_date_only_timestamp":
      return { key: "csvImport.errors.hourlyNeedsDateTime", vars: { line: error.line } };
    case "duplicate_timestamp":
      return { key: "csvImport.errors.duplicateTimestamp", vars: { line: error.line } };
    case "incomplete_series":
      return { key: "csvImport.errors.incompleteSeries", vars: { missing: error.missingCount } };
    case "wrong_row_count":
      return {
        key: "csvImport.errors.wrongRowCount",
        vars: { expected: error.expected, actual: error.actual },
      };
  }
}
