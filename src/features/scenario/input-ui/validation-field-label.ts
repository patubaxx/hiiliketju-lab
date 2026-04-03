import { PROCESS_FIELD_ORDER, type ProcessSchemaKey } from "@/features/scenario/input-ui/form-state";

type TFn = (id: string, vars?: Record<string, string>) => string;

/**
 * Maps validation error paths to user-facing field context for display only.
 * Does not change validation rules or paths produced by the engine.
 */
export function friendlyLabelForValidationPath(path: string, t: TFn): string | null {
  if (path === "_root") {
    return t("validation.field.general");
  }

  const monthly = /^co2\.availability\.monthlyRelativeWeights\.(\d+)$/.exec(path);
  if (monthly) {
    const idx = Number(monthly[1]);
    return `${t("co2.month")} ${idx + 1}`;
  }

  if (path.startsWith("process.")) {
    const key = path.split(".")[1] as ProcessSchemaKey | undefined;
    if (key) {
      const row = PROCESS_FIELD_ORDER.find((p) => p.key === key);
      if (row) return t(row.labelId);
    }
  }

  const exact: Record<string, string> = {
    scenarioName: "scenarioForm.scenarioName",
    periodDays: "validation.field.periodDays",
    "co2.annualAmountKtPerYear": "co2.annualKt",
    "co2.utilizationRatePct": "co2.utilization",
    "co2.availability": "sections.co2",
    "assumptionsMeta.assumptionsVersion": "scenarioForm.assumptionsVersion",
    "assumptionsMeta.notes": "scenarioForm.assumptionsNotes",
    "electricity.priceEurPerMwh": "electricity.constantPrice",
    "electricity.dailyPricesEurPerMwh": "electricity.seriesDailyLabel",
    "electricity.hourlyPricesEurPerMwh": "electricity.seriesHourlyLabel",
    "electricity.pricesEurPerMwh": "electricity.seriesDailyLabel",
    "economics.methanePriceEurPerTch4": "economics.methanePrice",
    "economics.hydrogenPriceEurPerKg": "economics.hydrogenPrice",
    "economics.otherOpexEurPerYear": "economics.otherOpex",
    "economics.electrolyzerCapexEur": "economics.electrolyzerCapex",
    "economics.methanationCapexEur": "economics.methanationCapex",
    "economics.capexLifetimeYears": "economics.capexLifetime",
  };

  if (exact[path]) {
    return t(exact[path]);
  }

  if (path.startsWith("co2.availability.dailyAvailableCo2Kg")) {
    return t("co2.seriesDailyLabel");
  }
  if (path.startsWith("co2.availability.hourlyAvailableCo2Kg")) {
    return t("co2.seriesHourlyLabel");
  }
  if (path.startsWith("electricity.dailyPricesEurPerMwh")) {
    return t("electricity.seriesDailyLabel");
  }
  if (path.startsWith("electricity.hourlyPricesEurPerMwh")) {
    return t("electricity.seriesHourlyLabel");
  }
  if (path.startsWith("electricity.pricesEurPerMwh")) {
    return t("electricity.seriesDailyLabel");
  }

  return null;
}
