/** MVP fixed horizon (non-leap year). */
export const SCENARIO_PERIOD_DAYS = 365 as const;
export type ScenarioPeriodDays = typeof SCENARIO_PERIOD_DAYS;

export const PROFILE_MODE_MONTHLY_WEIGHTED = "monthly_weighted" as const;
export type AvailabilityProfileMode = typeof PROFILE_MODE_MONTHLY_WEIGHTED;

/** Twelve monthly relative weights (zeros allowed; all-zero invalid at validation). */
export type MonthlyWeights12 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export type AvailabilityProfileInput = {
  readonly mode: AvailabilityProfileMode;
  readonly monthlyWeights: MonthlyWeights12;
};

export type Co2Input = {
  readonly annualAmountTons: number;
  readonly utilizationRatePct: number;
  readonly availabilityProfile: AvailabilityProfileInput;
};

export type EnergyInput = {
  readonly electricityPriceEurPerMWh: number;
};

export type EconomicsInput = {
  /**
   * Methane price/value numeric input; unit is not finalized — see `MethaneValueUnit`.
   * TODO(customer-data): bind to real formula unit.
   */
  readonly methanePrice: number;
  readonly hydrogenPriceEurPerKg: number;
  readonly otherOpexEurPerYear: number;
  readonly capexEur: number;
  readonly capexLifetimeYears: number;
  readonly discountRatePct: number;
  readonly capexAnnualizationMethod: "annuity";
};

/**
 * Process-side parameters; many formulas are still customer-provided.
 * Keys in the record bags are intentionally open until the formula package names them.
 */
export type ProcessAssumptions = {
  readonly methaneConversionParams: Readonly<Record<string, number>>;
  readonly hydrogenDemandParams: Readonly<Record<string, number>>;
  readonly energyConsumptionParams: Readonly<Record<string, number>>;
  /** TODO(customer-data): formula package */
  readonly plantAvailabilityPct?: number;
  /** TODO(customer-data): formula package */
  readonly processEfficiencyPct?: number;
};

export type AssumptionsMeta = {
  readonly assumptionsVersion: string;
  readonly notes?: string;
};

export type ScenarioInput = {
  readonly scenarioName: string;
  readonly periodDays: ScenarioPeriodDays;
  readonly co2: Co2Input;
  readonly energy: EnergyInput;
  readonly economics: EconomicsInput;
  readonly process: ProcessAssumptions;
  readonly assumptionsMeta: AssumptionsMeta;
};
