#!/usr/bin/env node
/**
 * scripts/generate-electricity-defaults-2025-fi.js
 *
 * Generates deterministic 2025 Finnish electricity price defaults from the
 * repository-local source CSV. Run once to regenerate the checked-in artifact:
 *
 *   node scripts/generate-electricity-defaults-2025-fi.js
 *
 * Source:  sources/electricity_prices.csv  (porssisahko.net quarter-hourly data)
 * Output:  src/data/electricity-defaults-2025-fi.ts
 *
 * ─── Data provenance ────────────────────────────────────────────────────────
 * Source unit  : snt/kWh (Finnish euro-cents per kWh, VAT included)
 * Target unit  : EUR/MWh   (conversion: × 10; 1 snt/kWh = 10 EUR/MWh)
 * Granularity  : quarter-hourly (15-minute intervals) in local Finnish time
 * DST handling : source contains 92 rows for the spring-forward day (2025-03-30)
 *                and 100 rows for the fall-back day (2025-10-26) including the
 *                duplicated 03:xx timestamps with different prices. Both days are
 *                processed sequentially (4 quarter-hours → 1 hourly value) so the
 *                output has exactly 8 760 hourly and 365 daily values.
 *
 * ─── Aggregation ────────────────────────────────────────────────────────────
 * Hourly : arithmetic mean of 4 consecutive quarter-hourly values per clock hour
 *           (sequential chunking within each calendar date, no reliance on HH label).
 * Daily  : arithmetic mean of all hourly values for that calendar date
 *           (23 values for the spring-forward day, 25 for the fall-back day).
 */

"use strict";

const fs = require("fs");
const path = require("path");

const SOURCE_CSV = path.resolve(__dirname, "../sources/electricity_prices.csv");
const OUTPUT_TS = path.resolve(__dirname, "../src/data/electricity-defaults-2025-fi.ts");
const HEADER_ROWS = 4;

/** Parse "DD.MM.YYYY HH:MM:SS" timestamp → { dateKey "YYYY-MM-DD" }. */
function parseDateKey(ts) {
  const [datePart] = ts.trim().split(" ");
  const [day, month, year] = datePart.split(".");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** Parse Finnish decimal number "3,094" or "12,452" → float. */
function parseFinnishDecimal(raw) {
  return parseFloat(raw.replace(",", "."));
}

// ─── Read and filter 2025 rows ───────────────────────────────────────────────
const text = fs.readFileSync(SOURCE_CSV, "utf-8");
const lines = text.split("\n");
const dataLines = lines.slice(HEADER_ROWS).filter((l) => l.trim());

// Group rows by calendar date, keeping file order within each date.
/** @type {Map<string, string[]>} dateKey → ordered array of raw price strings */
const byDate = new Map();

for (const line of dataLines) {
  const commaIdx = line.indexOf(",");
  if (commaIdx === -1) continue;

  const tsPart = line.slice(0, commaIdx).trim();
  let pricePart = line.slice(commaIdx + 1).trim().replace(/\r$/, "");

  // Year check: extract YYYY from "DD.MM.YYYY HH:MM:SS"
  const dotIdx = tsPart.indexOf(".");
  const year = tsPart.slice(dotIdx + 4, dotIdx + 8);
  if (year !== "2025") continue;

  // Remove surrounding quotes if present (price may contain a decimal comma)
  if (pricePart.startsWith('"') && pricePart.endsWith('"')) {
    pricePart = pricePart.slice(1, -1);
  }

  const dateKey = parseDateKey(tsPart);
  if (!byDate.has(dateKey)) byDate.set(dateKey, []);
  byDate.get(dateKey).push(pricePart);
}

// ─── Validate and sort dates ─────────────────────────────────────────────────
const sortedDates = [...byDate.keys()].sort();

if (sortedDates.length !== 365) {
  throw new Error(
    `Expected 365 calendar dates for 2025, got ${sortedDates.length}. ` +
      `Check the source CSV for completeness.`,
  );
}

// ─── Build hourly and daily arrays ───────────────────────────────────────────
/** @type {number[]} EUR/MWh, 8 760 values */
const hourlyEurPerMwh = [];
/** @type {number[]} EUR/MWh, 365 values */
const dailyEurPerMwh = [];

for (const dateKey of sortedDates) {
  const rawPrices = byDate.get(dateKey);

  if (rawPrices.length % 4 !== 0) {
    throw new Error(
      `Date ${dateKey} has ${rawPrices.length} quarter-hourly rows, ` +
        `which is not divisible by 4. Cannot build clean hourly averages.`,
    );
  }

  /** Hourly EUR/MWh for this calendar date */
  const dayHourly = [];

  // Sequential chunk: every 4 consecutive quarter-hours → 1 clock-hour average.
  for (let i = 0; i < rawPrices.length; i += 4) {
    let sum = 0;
    for (let j = 0; j < 4; j++) {
      const snt = parseFinnishDecimal(rawPrices[i + j]);
      if (Number.isNaN(snt)) {
        throw new Error(`NaN at date ${dateKey} row ${i + j}: "${rawPrices[i + j]}"`);
      }
      // Convert snt/kWh → EUR/MWh: × 10
      sum += snt * 10;
    }
    dayHourly.push(sum / 4);
  }

  // Daily average = arithmetic mean of all hourly values for this date.
  const daySum = dayHourly.reduce((s, v) => s + v, 0);
  dailyEurPerMwh.push(daySum / dayHourly.length);

  for (const h of dayHourly) hourlyEurPerMwh.push(h);
}

// ─── Final shape validation ──────────────────────────────────────────────────
if (hourlyEurPerMwh.length !== 8760) {
  throw new Error(
    `Expected 8 760 hourly values, built ${hourlyEurPerMwh.length}. ` +
      `Check DST row counts in the source.`,
  );
}
if (dailyEurPerMwh.length !== 365) {
  throw new Error(
    `Expected 365 daily values, built ${dailyEurPerMwh.length}.`,
  );
}

// Sanity: daily mean must equal mean of the corresponding 24 hourly slots
// (use index 0 = Jan 1, which is a standard 24-hour day).
const jan1DailyMean = dailyEurPerMwh[0];
const jan1HourlyMean =
  hourlyEurPerMwh.slice(0, 24).reduce((s, v) => s + v, 0) / 24;
if (Math.abs(jan1DailyMean - jan1HourlyMean) > 1e-9) {
  throw new Error(
    `Internal check failed: Jan-1 daily mean (${jan1DailyMean}) ≠ ` +
      `mean of first 24 hourly values (${jan1HourlyMean}).`,
  );
}

// ─── Round to 4 decimal places for readability ───────────────────────────────
const fmt = (n) => +n.toFixed(4);
const hourlyFmt = hourlyEurPerMwh.map(fmt);
const dailyFmt = dailyEurPerMwh.map(fmt);

// ─── Write output ─────────────────────────────────────────────────────────────
const now = new Date().toISOString().slice(0, 10);

// Format hourly array: one line per calendar date with a date comment header,
// followed by the actual numeric values for that date.
const hourlyLinesDst = [];
let hIdx = 0;
for (let d = 0; d < 365; d++) {
  const dateKey = sortedDates[d];
  const count = byDate.get(dateKey).length / 4; // clock hours in this day
  const dayVals = hourlyFmt.slice(hIdx, hIdx + count);
  hourlyLinesDst.push(`  // ${dateKey} (${count} h)`);
  hourlyLinesDst.push(`  ${dayVals.join(", ")},`);
  hIdx += count;
}

const output = `// AUTO-GENERATED — do not edit manually.
// Regenerate: node scripts/generate-electricity-defaults-2025-fi.js
// Generated: ${now}
//
// Source   : sources/electricity_prices.csv (porssisahko.net)
// Coverage : calendar year 2025, Finland
// Raw unit : snt/kWh (Finnish euro-cents per kWh, VAT included)
// App unit : EUR/MWh (conversion: snt/kWh × 10)
//
// Hourly aggregation : arithmetic mean of 4 consecutive quarter-hourly values
//   per clock hour, sequential within each calendar date. DST transitions are
//   handled naturally: spring-forward day (2025-03-30) contributes 23 hourly
//   values, fall-back day (2025-10-26) contributes 25 hourly values.
// Daily aggregation  : arithmetic mean of all hourly values for the calendar date
//   (23, 24, or 25 values depending on DST).
//
// Totals: ${hourlyFmt.length} hourly values, ${dailyFmt.length} daily values.

/**
 * 2025 Finland electricity spot prices — hourly, EUR/MWh (8 760 values).
 * Source: porssisahko.net quarter-hourly CSV, VAT included, converted from snt/kWh × 10.
 * One value per clock hour, in chronological order starting 2025-01-01 00:xx.
 * DST notes: 2025-03-30 has 23 values, 2025-10-26 has 25 values.
 */
export const FINLAND_2025_HOURLY_EUR_PER_MWH: readonly number[] = [
${hourlyLinesDst.join("\n")}
] as const;

/**
 * 2025 Finland electricity spot prices — daily arithmetic means, EUR/MWh (365 values).
 * Derived from FINLAND_2025_HOURLY_EUR_PER_MWH: each value is the arithmetic mean
 * of all hourly prices for that calendar date (23, 24, or 25 values depending on DST).
 * Index 0 = 2025-01-01, index 364 = 2025-12-31.
 */
export const FINLAND_2025_DAILY_EUR_PER_MWH: readonly number[] = [
  ${dailyFmt.join(", ")}
] as const;
`;

fs.mkdirSync(path.dirname(OUTPUT_TS), { recursive: true });
fs.writeFileSync(OUTPUT_TS, output, "utf-8");

console.log(`Generated: ${OUTPUT_TS}`);
console.log(`  Hourly values : ${hourlyFmt.length}`);
console.log(`  Daily values  : ${dailyFmt.length}`);
console.log(`  Date range    : ${sortedDates[0]} → ${sortedDates[364]}`);
console.log(
  `  Hourly range  : ${Math.min(...hourlyFmt).toFixed(2)} … ${Math.max(...hourlyFmt).toFixed(2)} EUR/MWh`,
);
console.log(
  `  Daily range   : ${Math.min(...dailyFmt).toFixed(2)} … ${Math.max(...dailyFmt).toFixed(2)} EUR/MWh`,
);
