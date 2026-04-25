import type { ScenarioSummary } from "@/core/domain/result";

/**
 * Qualitative economic interpretation of the methane pathway vs costs and hydrogen-sales alternative.
 * Uses only existing `ScenarioSummary` fields from `calculateScenario` — no recomputed KPIs.
 */
export type EconomicVerdictCategory = "favorable" | "mixed" | "unfavorable" | "not_computable";

export type EconomicVerdict = {
  readonly category: EconomicVerdictCategory;
  readonly titleKey: string;
  readonly bodyKey: string;
  readonly detailKeys: readonly string[];
};

function isRequiredSummaryFinite(s: ScenarioSummary): boolean {
  return (
    Number.isFinite(s.annualMethaneRevenueEur) &&
    Number.isFinite(s.annualTotalCostEur) &&
    Number.isFinite(s.deltaVsHydrogenSaleEur) &&
    Number.isFinite(s.hydrogenSalesAlternativeRevenueEur)
  );
}

/**
 * Deterministic verdict from canonical annual summary only.
 */
export function buildEconomicVerdict(summary: ScenarioSummary): EconomicVerdict {
  const commonDetails = ["results.verdict.disclaimer"] as const;

  if (
    !Number.isFinite(summary.annualMethaneProducedTons) ||
    summary.annualMethaneProducedTons <= 0 ||
    summary.breakEvenMethanePriceEurPerTon === null ||
    !Number.isFinite(summary.breakEvenMethanePriceEurPerTon) ||
    !isRequiredSummaryFinite(summary)
  ) {
    return {
      category: "not_computable",
      titleKey: "results.verdict.notComputableTitle",
      bodyKey: "results.verdict.notComputableBody",
      detailKeys: commonDetails,
    };
  }

  const rev = summary.annualMethaneRevenueEur;
  const cost = summary.annualTotalCostEur;
  const delta = summary.deltaVsHydrogenSaleEur;

  const coversCost = rev >= cost;
  const weakVsH2 = delta < 0;

  if (coversCost && !weakVsH2) {
    return {
      category: "favorable",
      titleKey: "results.verdict.favorableTitle",
      bodyKey: "results.verdict.favorableBody",
      detailKeys: commonDetails,
    };
  }

  if (!coversCost && weakVsH2) {
    return {
      category: "unfavorable",
      titleKey: "results.verdict.unfavorableTitle",
      bodyKey: "results.verdict.unfavorableBody",
      detailKeys: commonDetails,
    };
  }

  return {
    category: "mixed",
    titleKey: "results.verdict.mixedTitle",
    bodyKey: "results.verdict.mixedBody",
    detailKeys: ["results.verdict.mixedDetail", ...commonDetails],
  };
}
