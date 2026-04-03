/**
 * Golden scenario **inputs** (MVP regression fixtures).
 * Expected metrics are asserted in tests using helpers + documented arithmetic.
 */

/** GS-001 — flat annual CO₂, constant electricity, CAPEX off, round numbers. */
export const GS001_FLAT_ANNUAL_BASELINE_RAW = {
  scenarioName: "GS-001 flat annual baseline",
  periodDays: 365 as const,
  co2: {
    annualAmountKtPerYear: 1,
    utilizationRatePct: 100,
    availability: { mode: "flat_annual" as const },
  },
  electricity: {
    mode: "constant" as const,
    priceEurPerMwh: 50,
  },
  economics: {
    methanePriceEurPerTch4: 120,
    hydrogenPriceEurPerKg: 6,
    otherOpexEurPerYear: 0,
    includeCapex: false,
  },
  assumptionsMeta: {
    assumptionsVersion: "golden_gs001",
    notes: "Golden baseline — not customer-confirmed",
  },
  process: {},
} as const;

/** GS-002 — seasonal CO₂, daily electricity series, CAPEX on. */
const dailyPricesGs002 = Array.from({ length: 365 }, (_, d) => 40 + (d % 7));

export const GS002_SEASONAL_CAPEX_RAW = {
  scenarioName: "GS-002 seasonal + CAPEX",
  periodDays: 365 as const,
  co2: {
    annualAmountKtPerYear: 1,
    utilizationRatePct: 100,
    availability: {
      mode: "seasonal_daily" as const,
      monthlyRelativeWeights: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    },
  },
  electricity: {
    mode: "daily_series" as const,
    dailyPricesEurPerMwh: dailyPricesGs002,
  },
  economics: {
    methanePriceEurPerTch4: 200,
    hydrogenPriceEurPerKg: 5,
    otherOpexEurPerYear: 36_500,
    includeCapex: true,
    electrolyzerCapexEur: 1_000_000,
    methanationCapexEur: 500_000,
    capexLifetimeYears: 10,
  },
  assumptionsMeta: {
    assumptionsVersion: "golden_gs002",
  },
  process: {},
} as const;

/** GS-003 — SEC kWh/MWh mismatch (warning) while other defaults stay literature-estimated. */
export const GS003_SEC_WARNING_RAW = {
  scenarioName: "GS-003 SEC mismatch warnings",
  periodDays: 365 as const,
  co2: {
    annualAmountKtPerYear: 0.365,
    utilizationRatePct: 100,
    availability: { mode: "flat_annual" as const },
  },
  electricity: { mode: "constant" as const, priceEurPerMwh: 10 },
  economics: {
    methanePriceEurPerTch4: 0,
    hydrogenPriceEurPerKg: 0,
    otherOpexEurPerYear: 0,
    includeCapex: false,
  },
  assumptionsMeta: { assumptionsVersion: "golden_gs003" },
  process: {
    electrolyzerSpecificEnergyConsumptionKwhPerKgH2: {
      value: 40,
      assumptionMeta: {
        assumptionSource: "customer_provided" as const,
        assumptionStatus: "confirmed" as const,
      },
    },
    electrolyzerSpecificEnergyConsumptionMwhPerKgH2: {
      value: 0.054,
      assumptionMeta: {
        assumptionSource: "customer_provided" as const,
        assumptionStatus: "confirmed" as const,
      },
    },
  },
} as const;

/**
 * Independent totals for GS-001 (1 kt/y flat, 100% util, default stoichiometry & SEC).
 * annualCo2 kg = 1e6; daily available = 1e6/365.
 */
export const GS001_EXPECTED_ANNUAL = {
  annualCO2AvailableKg: 1_000_000,
  annualCO2UtilizedKg: 1_000_000,
  co2RecyclingRatePct: 100,
  annualHydrogenNeededKg: 183_200,
  annualMethaneProducedTons: 364.5,
  annualElectricityConsumedMwh: 9892.8,
} as const;
