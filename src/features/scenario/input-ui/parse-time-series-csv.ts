/**
 * Browser-safe CSV → ordered numeric series for MVP time-series inputs (CO₂, electricity).
 * Normalizes to newline-separated values for the same textarea path as manual entry.
 */
import { NON_LEAP_MONTH_DAYS, SCENARIO_HOURLY_SLOTS, SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

export type TimeSeriesCsvResolution = "daily" | "hourly";

export type ParseTimeSeriesCsvError =
  | { code: "empty_file" }
  | { code: "no_data_rows" }
  | { code: "invalid_first_data_row"; line: number }
  | { code: "mixed_row_formats"; line: number }
  | { code: "invalid_number"; line: number }
  | { code: "invalid_timestamp"; line: number }
  | { code: "hourly_date_only_timestamp"; line: number }
  | { code: "duplicate_timestamp"; line: number }
  | { code: "incomplete_series"; missingCount: number }
  | { code: "wrong_row_count"; expected: number; actual: number };

export type ParseTimeSeriesCsvResult =
  | { ok: true; seriesText: string; values: readonly number[] }
  | { ok: false; error: ParseTimeSeriesCsvError };

function stripBom(raw: string): string {
  return raw.replace(/^\uFEFF/, "");
}

function splitLines(raw: string): string[] {
  const s = stripBom(raw);
  return s.split(/\r?\n/u).map((l) => l.trim());
}

function monthDayToDayIndex(month1: number, day: number): number | null {
  if (month1 < 1 || month1 > 12) return null;
  const dim = NON_LEAP_MONTH_DAYS[month1 - 1]!;
  if (day < 1 || day > dim) return null;
  let idx = 0;
  for (let m = 0; m < month1 - 1; m++) {
    idx += NON_LEAP_MONTH_DAYS[m]!;
  }
  return idx + (day - 1);
}

/** Parse MVP calendar slot from timestamp string (year ignored for day-of-year). */
function parseTimestampSlot(
  tsRaw: string,
  resolution: TimeSeriesCsvResolution,
): { slot: number } | null {
  const ts = tsRaw.trim();
  const mFull =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2})(?::(\d{2})(?::(\d{2}))?)?)?$/u.exec(ts);
  if (!mFull) return null;
  const month = Number(mFull[2]);
  const day = Number(mFull[3]);
  const dIdx = monthDayToDayIndex(month, day);
  if (dIdx === null) return null;

  const hPart = mFull[4];
  const minPart = mFull[5] ?? "00";
  const secPart = mFull[6] ?? "00";

  if (resolution === "daily") {
    if (hPart !== undefined) {
      const h = Number(hPart);
      const mi = Number(minPart);
      const se = Number(secPart);
      if (h !== 0 || mi !== 0 || se !== 0) return null;
    }
    if (dIdx < 0 || dIdx >= SCENARIO_PERIOD_DAYS) return null;
    return { slot: dIdx };
  }

  if (hPart === undefined) return null;
  const h = Number(hPart);
  if (!Number.isInteger(h) || h < 0 || h > 23) return null;
  const mi = Number(minPart);
  const se = Number(secPart);
  if (mi !== 0 || se !== 0) return null;
  const slot = dIdx * 24 + h;
  if (slot < 0 || slot >= SCENARIO_HOURLY_SLOTS) return null;
  return { slot };
}

/**
 * Parse a single numeric cell: ASCII dot decimal, or exactly one comma as decimal separator.
 */
export function parseNumericCell(cell: string): number | null {
  const s = cell.trim();
  if (s === "") return null;
  if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/u.test(s)) {
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  if (/^-?\d+,\d+$/u.test(s)) {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function splitTwoColumns(line: string): { left: string; right: string } | null {
  const t = line.trim();
  if (t.includes(";")) {
    const i = t.indexOf(";");
    return { left: t.slice(0, i).trim(), right: t.slice(i + 1).trim() };
  }
  const m = /^(\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2})?)?)\s*,\s*(.+)$/u.exec(t);
  if (m) {
    return { left: m[1]!.trim(), right: m[2]!.trim() };
  }
  return null;
}

function isProbableHeaderLine(line: string): boolean {
  const lower = line.toLowerCase();
  if (
    /\b(timestamp|date|time|value|price|datum|päiv|arvo|hinta|tid|värde)\b/u.test(lower) &&
    !/^\d{4}-\d{2}-\d{2}/u.test(line.trim())
  ) {
    return true;
  }
  const two = splitTwoColumns(line);
  if (two) {
    const v = parseNumericCell(two.right);
    const slot = parseTimestampSlot(two.left, "daily");
    const slotH = parseTimestampSlot(two.left, "hourly");
    if (v === null && slot === null && slotH === null) return true;
  }
  return false;
}

type RowMode = "single" | "double";

function classifyDataRow(line: string, resolution: TimeSeriesCsvResolution): RowMode | null {
  const two = splitTwoColumns(line);
  if (two) {
    const v = parseNumericCell(two.right);
    if (v === null) return null;
    const slot = parseTimestampSlot(two.left, resolution);
    if (slot === null) return null;
    return "double";
  }
  if (parseNumericCell(line) !== null) return "single";
  return null;
}

export function parseTimeSeriesCsv(
  raw: string,
  options: { resolution: TimeSeriesCsvResolution; expectedCount: number },
): ParseTimeSeriesCsvResult {
  const { resolution, expectedCount } = options;
  const linesAll = splitLines(raw).filter((l) => l.length > 0);
  if (linesAll.length === 0) {
    return { ok: false, error: { code: "empty_file" } };
  }

  let start = 0;
  if (isProbableHeaderLine(linesAll[0]!)) {
    start = 1;
  }

  const dataLines = linesAll.slice(start);
  if (dataLines.length === 0) {
    return { ok: false, error: { code: "no_data_rows" } };
  }

  const lineNo = (i: number) => start + i + 1;

  const firstMode = classifyDataRow(dataLines[0]!, resolution);
  if (firstMode === null) {
    const two = splitTwoColumns(dataLines[0]!);
    if (
      resolution === "hourly" &&
      two &&
      /^\d{4}-\d{2}-\d{2}$/u.test(two.left.trim()) &&
      parseNumericCell(two.right) !== null
    ) {
      return { ok: false, error: { code: "hourly_date_only_timestamp", line: lineNo(0) } };
    }
    return { ok: false, error: { code: "invalid_first_data_row", line: lineNo(0) } };
  }

  if (firstMode === "single") {
    if (dataLines.length !== expectedCount) {
      return {
        ok: false,
        error: { code: "wrong_row_count", expected: expectedCount, actual: dataLines.length },
      };
    }
    const values: number[] = [];
    for (let i = 0; i < dataLines.length; i++) {
      const row = dataLines[i]!;
      if (classifyDataRow(row, resolution) !== "single") {
        if (splitTwoColumns(row) === null && parseNumericCell(row) === null) {
          return { ok: false, error: { code: "invalid_number", line: lineNo(i) } };
        }
        return { ok: false, error: { code: "mixed_row_formats", line: lineNo(i) } };
      }
      const n = parseNumericCell(row);
      if (n === null) {
        return { ok: false, error: { code: "invalid_number", line: lineNo(i) } };
      }
      values.push(n);
    }
    const seriesText = values.join("\n");
    return { ok: true, seriesText, values };
  }

  const slots = new Map<number, number>();
  for (let i = 0; i < dataLines.length; i++) {
    const row = dataLines[i]!;
    if (classifyDataRow(row, resolution) !== "double") {
      return { ok: false, error: { code: "mixed_row_formats", line: lineNo(i) } };
    }
    const two = splitTwoColumns(row);
    if (!two) {
      return { ok: false, error: { code: "invalid_timestamp", line: lineNo(i) } };
    }
    const parsed = parseTimestampSlot(two.left, resolution);
    if (parsed === null) {
      if (resolution === "hourly" && /^\d{4}-\d{2}-\d{2}$/u.test(two.left.trim())) {
        return { ok: false, error: { code: "hourly_date_only_timestamp", line: lineNo(i) } };
      }
      return { ok: false, error: { code: "invalid_timestamp", line: lineNo(i) } };
    }
    const v = parseNumericCell(two.right);
    if (v === null) {
      return { ok: false, error: { code: "invalid_number", line: lineNo(i) } };
    }
    if (slots.has(parsed.slot)) {
      return { ok: false, error: { code: "duplicate_timestamp", line: lineNo(i) } };
    }
    slots.set(parsed.slot, v);
  }

  let missingSlots = 0;
  for (let s = 0; s < expectedCount; s++) {
    if (!slots.has(s)) missingSlots++;
  }
  if (missingSlots > 0) {
    return { ok: false, error: { code: "incomplete_series", missingCount: missingSlots } };
  }

  const values: number[] = [];
  for (let s = 0; s < expectedCount; s++) {
    values.push(slots.get(s)!);
  }
  const seriesText = values.join("\n");
  return { ok: true, seriesText, values };
}
