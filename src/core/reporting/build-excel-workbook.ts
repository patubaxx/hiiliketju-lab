import ExcelJS from "exceljs";

import type { ScenarioExcelExportModel } from "./build-export-model";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE7EEF7" },
};

const SECTION_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD0D8E4" },
};

/** Light amber tint for literature-based assumption rows (display only). */
const LITERATURE_ROW_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFF2E2" },
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFAAAAAA" } },
    };
  });
}

function styleSectionRow(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.eachCell((cell) => {
    cell.fill = SECTION_FILL;
  });
}

/** EUR amounts on canonical result (display format only; not Excel formula truth). */
const EUR_NUMFMT = '"€"#,##0.00';

function setColumnWidths(sheet: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });
}

/**
 * Builds an ExcelJS workbook from a pre-mapped export model (no KPI recomputation).
 */
export function buildScenarioExcelWorkbook(model: ScenarioExcelExportModel): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Hiiliketju";
  wb.created = new Date();

  // --- Inputs ---
  const inputs = wb.addWorksheet("Inputs", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  inputs.addRow(["Key / section", "Value"]);
  styleHeaderRow(inputs.getRow(1));
  for (const row of model.inputs) {
    if (row.kind === "section") {
      const r = inputs.addRow([row.title, ""]);
      styleSectionRow(r);
    } else {
      inputs.addRow([row.key, row.value]);
    }
  }
  setColumnWidths(inputs, [44, 56]);

  // --- Economic verdict (WP25) ---
  const ev = wb.addWorksheet("Economic verdict", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ev.addRow(["Field", "Value"]);
  styleHeaderRow(ev.getRow(1));
  ev.addRow(["Category (qualitative)", model.economicVerdict.category]);
  ev.addRow(["Title", model.economicVerdict.title]);
  ev.addRow(["Conclusion", model.economicVerdict.body]);
  for (const line of model.economicVerdict.details) {
    ev.addRow(["Detail", line]);
  }
  setColumnWidths(ev, [30, 70]);

  // --- Used assumptions (WP25) ---
  const u = wb.addWorksheet("Used assumptions", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  u.addRow(["Group", "Field", "Value", "Source", "Status", "Note"]);
  styleHeaderRow(u.getRow(1));
  for (const r of model.usedAssumptionsPrint) {
    u.addRow([r.groupLabel, r.label, r.value, r.source ?? "", r.status ?? "", r.note ?? ""]);
  }
  setColumnWidths(u, [20, 28, 36, 18, 18, 32]);

  // --- Assumptions ---
  const assumptions = wb.addWorksheet("Assumptions", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  assumptions.addRow(["Field", "Value", "Unit", "assumptionSource", "assumptionStatus", "assumptionNote"]);
  styleHeaderRow(assumptions.getRow(1));
  for (const a of model.processAssumptions) {
    const row = assumptions.addRow([
      a.fieldLabel,
      a.value,
      a.unit,
      a.assumptionSource,
      a.assumptionStatus,
      a.assumptionNote,
    ]);
    if (a.assumptionSource === "literature_based") {
      row.eachCell((cell) => {
        cell.fill = LITERATURE_ROW_FILL;
      });
    }
  }
  setColumnWidths(assumptions, [36, 14, 18, 22, 28, 50]);

  // --- CO2 Profile ---
  const co2 = wb.addWorksheet("CO2 Profile", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  co2.addRow([...model.co2Profile.headers]);
  styleHeaderRow(co2.getRow(1));
  for (const r of model.co2Profile.rows) {
    co2.addRow([r.dayIndex, r.dateLabel, r.availableCO2Kg, r.unit]);
  }
  setColumnWidths(co2, [10, 14, 18, 12]);

  // --- Electricity purchase price ---
  const elec = wb.addWorksheet("Electricity purchase price", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  elec.addRow([...model.electricityPrice.headers]);
  styleHeaderRow(elec.getRow(1));
  for (const r of model.electricityPrice.rows) {
    elec.addRow([r.dayIndex, r.dateLabel, r.priceEurPerMwh, r.unit]);
  }
  setColumnWidths(elec, [10, 14, 18, 12]);

  // --- Daily Results ---
  const daily = wb.addWorksheet("Daily Results", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  daily.addRow([...model.dailyResults.headers]);
  styleHeaderRow(daily.getRow(1));
  const eurDailyCols = new Set([
    "co2PurchaseCostEur",
    "electricityCostEur",
    "variableCostEur",
    "allocatedCapexCostEur",
    "totalCostEur",
    "methaneRevenueEur",
    "hydrogenAlternativeRevenueEur",
  ]);
  const twoDecCols = new Set([
    "availableCO2Kg",
    "usableCO2Kg",
    "freeCo2UsedKg",
    "purchasedCo2Kg",
    "hydrogenNeededKg",
    "methaneProducedKg",
    "electricityConsumedMwh",
  ]);
  for (const rowObj of model.dailyResults.rows) {
    const values = model.dailyResults.headers.map((h) => rowObj[h] ?? "");
    const excelRow = daily.addRow(values);
    model.dailyResults.headers.forEach((h, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      if (eurDailyCols.has(h)) {
        cell.numFmt = EUR_NUMFMT;
      } else if (twoDecCols.has(h) && typeof rowObj[h] === "number") {
        cell.numFmt = "0.00";
      }
    });
  }
  setColumnWidths(daily, model.dailyResults.headers.map((h) => (h === "dateLabel" ? 12 : h.endsWith("Eur") ? 18 : 15)));

  // --- Annual Summary (includes monthly block) ---
  const annual = wb.addWorksheet("Annual Summary", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  annual.addRow(["Metric", "Value", "Unit"]);
  styleHeaderRow(annual.getRow(1));
  for (const m of model.annualMetrics) {
    const r = annual.addRow([m.label, m.value ?? "", m.unit]);
    const valueCell = r.getCell(2);
    if (m.unit === "EUR") {
      valueCell.numFmt = EUR_NUMFMT;
    } else if (m.value !== null && typeof m.value === "number") {
      valueCell.numFmt = "0.00";
    }
  }

  annual.addRow([]);
  styleSectionRow(annual.addRow(["Monthly summary (from calculation)", "", ""]));
  annual.addRow([
    "monthIndex",
    "firstDayIndex",
    "lastDayIndex",
    "usableCO2Kg",
    "freeCo2UsedKg",
    "purchasedCo2Kg",
    "co2PurchaseCostEur",
    "h2CapacityBindingDays",
    "ch4CapacityBindingDays",
    "methaneProducedKg",
    "electricityConsumedMwh",
    "totalCostEur",
    "methaneRevenueEur",
    "hydrogenAlternativeRevenueEur",
  ]);
  styleHeaderRow(annual.getRow(annual.rowCount));
  for (const m of model.monthlyRows) {
    const r = annual.addRow([
      m.monthIndex,
      m.firstDayIndex,
      m.lastDayIndex,
      m.usableCO2Kg,
      m.freeCo2UsedKg,
      m.purchasedCo2Kg,
      m.co2PurchaseCostEur,
      m.h2CapacityBindingDays,
      m.ch4CapacityBindingDays,
      m.methaneProducedKg,
      m.electricityConsumedMwh,
      m.totalCostEur,
      m.methaneRevenueEur,
      m.hydrogenAlternativeRevenueEur,
    ]);
    r.getCell(4).numFmt = "0.00";
    r.getCell(5).numFmt = "0.00";
    r.getCell(6).numFmt = "0.00";
    r.getCell(7).numFmt = EUR_NUMFMT;
    r.getCell(10).numFmt = "0.00";
    r.getCell(11).numFmt = "0.00";
    r.getCell(12).numFmt = EUR_NUMFMT;
    r.getCell(13).numFmt = EUR_NUMFMT;
    r.getCell(14).numFmt = EUR_NUMFMT;
  }
  setColumnWidths(annual, [40, 22, 14, 16, 16, 16, 18, 16, 18, 16, 18, 18, 18, 22]);

  // --- Comparison ---
  const cmp = wb.addWorksheet("Comparison", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  cmp.addRow(["Description", "Value (EUR)"]);
  styleHeaderRow(cmp.getRow(1));
  for (const c of model.comparison) {
    const r = cmp.addRow([c.label, c.valueEur]);
    r.getCell(2).numFmt = EUR_NUMFMT;
  }
  setColumnWidths(cmp, [48, 22]);

  // --- Warnings ---
  const warn = wb.addWorksheet("Warnings", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  warn.addRow(["#", "warning (opaque engine string)"]);
  styleHeaderRow(warn.getRow(1));
  if (model.warnings.length === 0) {
    warn.addRow(["", "(none)"]);
  } else {
    model.warnings.forEach((w, i) => {
      warn.addRow([i + 1, w]);
    });
  }
  setColumnWidths(warn, [6, 90]);

  return wb;
}

/**
 * Serializes the workbook to a buffer (browser or Node).
 */
export async function scenarioExcelWorkbookToBuffer(model: ScenarioExcelExportModel): Promise<ArrayBuffer> {
  const wb = buildScenarioExcelWorkbook(model);
  const raw = await wb.xlsx.writeBuffer();
  if (raw instanceof ArrayBuffer) {
    return raw;
  }
  const src = new Uint8Array(raw as ArrayLike<number>);
  const out = new ArrayBuffer(src.byteLength);
  new Uint8Array(out).set(src);
  return out;
}
