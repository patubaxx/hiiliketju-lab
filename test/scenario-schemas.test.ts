import { describe, expect, it } from "vitest";

import { buildSeasonalDailyCo2ProfileKg } from "@/core/calculation/build-seasonal-daily-co2-profile";
import { annualCo2KtPerYearToKgPerYear } from "@/core/domain/units";
import {
  co2AvailabilityInputSchema,
  monthlyRelativeWeights12Schema,
} from "@/features/scenario/schemas/co2-availability-schema";
import { electricityPriceInputSchema } from "@/features/scenario/schemas/electricity-price-schema";
import { parseScenarioInput, safeParseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

const ones365 = Array.from({ length: 365 }, () => 1);
const zeros8760 = Array.from({ length: 8760 }, () => 0);

const equalSeasonalWeights = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as const;

function baseScenario(overrides?: Record<string, unknown>) {
  return {
    scenarioName: "Test scenario",
    periodDays: 365,
    co2: {
      annualAmountKtPerYear: 1,
      utilizationRatePct: 50,
      availability: {
        mode: "flat_annual" as const,
      },
    },
    electricity: {
      mode: "constant" as const,
      priceEurPerMwh: 80,
    },
    economics: {
      methanePriceEurPerTch4: 0,
      hydrogenPriceEurPerKg: 5,
      otherOpexEurPerYear: 0,
      includeCapex: false,
    },
    assumptionsMeta: {
      assumptionsVersion: "HIILIKETJU_ASSUMPTIONS_v2_2026-04",
    },
    ...overrides,
  };
}

describe("monthlyRelativeWeights12Schema", () => {
  it("accepts a valid 12-month profile with zeros allowed", () => {
    const weights = [2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as const;
    const result = monthlyRelativeWeights12Schema.safeParse(weights);
    expect(result.success).toBe(true);
  });

  it("rejects wrong-length monthly weights", () => {
    const result = monthlyRelativeWeights12Schema.safeParse([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(result.success).toBe(false);
  });

  it("rejects negative monthly weights", () => {
    const bad = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -0.01] as const;
    const result = monthlyRelativeWeights12Schema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects all-zero monthly weights", () => {
    const zeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as const;
    const result = monthlyRelativeWeights12Schema.safeParse(zeros);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i: { message: string }) =>
          i.message.includes("validation.zod.seasonalWeightsNotAllZero"),
        ),
      ).toBe(true);
    }
  });
});

describe("co2AvailabilityInputSchema", () => {
  it("accepts flat_annual", () => {
    const parsed = co2AvailabilityInputSchema.parse({ mode: "flat_annual" });
    expect(parsed.mode).toBe("flat_annual");
  });

  it("accepts seasonal_daily", () => {
    const parsed = co2AvailabilityInputSchema.parse({
      mode: "seasonal_daily",
      monthlyRelativeWeights: [...equalSeasonalWeights],
    });
    expect(parsed.mode).toBe("seasonal_daily");
  });

  it("rejects time_series_daily with wrong length", () => {
    const result = co2AvailabilityInputSchema.safeParse({
      mode: "time_series_daily",
      dailyAvailableCo2Kg: ones365.slice(0, 10),
    });
    expect(result.success).toBe(false);
  });

  it("rejects time_series_daily with a negative entry", () => {
    const series = [...ones365];
    series[5] = -0.01;
    const result = co2AvailabilityInputSchema.safeParse({
      mode: "time_series_daily",
      dailyAvailableCo2Kg: series,
    });
    expect(result.success).toBe(false);
  });

  it("rejects time_series_hourly with wrong length", () => {
    const result = co2AvailabilityInputSchema.safeParse({
      mode: "time_series_hourly",
      hourlyAvailableCo2Kg: zeros8760.slice(0, 100),
    });
    expect(result.success).toBe(false);
  });
});

describe("electricityPriceInputSchema", () => {
  it("accepts constant mode", () => {
    const parsed = electricityPriceInputSchema.parse({
      mode: "constant",
      priceEurPerMwh: 50,
    });
    expect(parsed.mode).toBe("constant");
  });

  it("accepts daily_series with 365 points", () => {
    const parsed = electricityPriceInputSchema.parse({
      mode: "daily_series",
      dailyPricesEurPerMwh: ones365,
    });
    expect(parsed.mode).toBe("daily_series");
    if (parsed.mode === "daily_series") {
      expect(parsed.dailyPricesEurPerMwh).toHaveLength(365);
    }
  });

  it("rejects hourly_series with wrong length", () => {
    const result = electricityPriceInputSchema.safeParse({
      mode: "hourly_series",
      hourlyPricesEurPerMwh: zeros8760.slice(0, 100),
    });
    expect(result.success).toBe(false);
  });

  it("accepts historical_market_data_imported daily resolution", () => {
    const parsed = electricityPriceInputSchema.parse({
      mode: "historical_market_data_imported",
      resolution: "daily",
      pricesEurPerMwh: ones365,
    });
    expect(parsed.mode).toBe("historical_market_data_imported");
    if (parsed.mode === "historical_market_data_imported") {
      expect(parsed.resolution).toBe("daily");
    }
  });

  it("accepts daily_series with negative EUR/MWh (spot-style prices)", () => {
    const daily = [...ones365];
    daily[3] = -50.25;
    const parsed = electricityPriceInputSchema.parse({
      mode: "daily_series",
      dailyPricesEurPerMwh: daily,
    });
    expect(parsed.mode).toBe("daily_series");
    if (parsed.mode === "daily_series") {
      expect(parsed.dailyPricesEurPerMwh[3]).toBe(-50.25);
    }
  });

  it("accepts hourly_series with negative EUR/MWh", () => {
    const hourly = Array.from({ length: 8760 }, (_, i) => (i === 42 ? -0.01 : 0));
    const parsed = electricityPriceInputSchema.parse({
      mode: "hourly_series",
      hourlyPricesEurPerMwh: hourly,
    });
    expect(parsed.mode).toBe("hourly_series");
    if (parsed.mode === "hourly_series") {
      expect(parsed.hourlyPricesEurPerMwh[42]).toBe(-0.01);
    }
  });

  it("accepts historical_market_data_imported hourly resolution with negative prices", () => {
    const hourly = Array.from({ length: 8760 }, () => -2);
    const parsed = electricityPriceInputSchema.parse({
      mode: "historical_market_data_imported",
      resolution: "hourly",
      pricesEurPerMwh: hourly,
    });
    expect(parsed.mode).toBe("historical_market_data_imported");
  });

  it("rejects constant mode with negative price", () => {
    const result = electricityPriceInputSchema.safeParse({
      mode: "constant",
      priceEurPerMwh: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("scenarioInputSchema", () => {
  it("accepts a valid minimal scenario (no CAPEX)", () => {
    const parsed = parseScenarioInput(baseScenario());
    expect(parsed.scenarioName).toBe("Test scenario");
    expect(parsed.periodDays).toBe(365);
    expect(parsed.co2.availability.mode).toBe("flat_annual");
    expect(parsed.economics.includeCapex).toBe(false);
    expect(parsed.process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2.value).toBe(0.1832);
  });

  it("requires CAPEX fields when includeCapex is true", () => {
    const result = safeParseScenarioInput(
      baseScenario({
        economics: {
          methanePriceEurPerTch4: 100,
          hydrogenPriceEurPerKg: 5,
          otherOpexEurPerYear: 0,
          includeCapex: true,
        },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts includeCapex with all required fields", () => {
    const parsed = parseScenarioInput(
      baseScenario({
        economics: {
          methanePriceEurPerTch4: 100,
          hydrogenPriceEurPerKg: 5,
          otherOpexEurPerYear: 0,
          includeCapex: true,
          electrolyzerCapexEur: 1_000_000,
          methanationCapexEur: 500_000,
          capexLifetimeYears: 20,
        },
      }),
    );
    expect(parsed.economics.includeCapex).toBe(true);
    expect(parsed.economics.electrolyzerCapexEur).toBe(1_000_000);
    expect(parsed.economics.methanationCapexEur).toBe(500_000);
    expect(parsed.economics.capexLifetimeYears).toBe(20);
  });

  it("rejects utilization rate below 0", () => {
    const result = safeParseScenarioInput(
      baseScenario({
        co2: {
          annualAmountKtPerYear: 1,
          utilizationRatePct: -1,
          availability: { mode: "flat_annual" },
        },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects utilization rate above 100", () => {
    const result = safeParseScenarioInput(
      baseScenario({
        co2: {
          annualAmountKtPerYear: 1,
          utilizationRatePct: 100.01,
          availability: { mode: "flat_annual" },
        },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts utilization rate at boundaries 0 and 100", () => {
    expect(
      safeParseScenarioInput(
        baseScenario({
          co2: {
            annualAmountKtPerYear: 1,
            utilizationRatePct: 0,
            availability: { mode: "flat_annual" },
          },
        }),
      ).success,
    ).toBe(true);
    expect(
      safeParseScenarioInput(
        baseScenario({
          co2: {
            annualAmountKtPerYear: 1,
            utilizationRatePct: 100,
            availability: { mode: "flat_annual" },
          },
        }),
      ).success,
    ).toBe(true);
  });

  it("rejects NaN in electricity price", () => {
    const result = safeParseScenarioInput(
      baseScenario({
        electricity: { mode: "constant", priceEurPerMwh: Number.NaN },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts full scenario with electricity daily_series containing negative prices", () => {
    const daily = [...ones365];
    daily[0] = -10;
    expect(
      safeParseScenarioInput(
        baseScenario({
          electricity: { mode: "daily_series", dailyPricesEurPerMwh: daily },
        }),
      ).success,
    ).toBe(true);
  });

  it("rejects constant electricity with negative price on full scenario", () => {
    expect(
      safeParseScenarioInput(
        baseScenario({
          electricity: { mode: "constant", priceEurPerMwh: -0.01 },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects negative methane price", () => {
    const result = safeParseScenarioInput(
      baseScenario({
        economics: {
          methanePriceEurPerTch4: -1,
          hydrogenPriceEurPerKg: 5,
          otherOpexEurPerYear: 0,
          includeCapex: false,
        },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects empty scenario name", () => {
    expect(safeParseScenarioInput(baseScenario({ scenarioName: "" })).success).toBe(false);
  });

  it("rejects whitespace-only scenario name", () => {
    expect(safeParseScenarioInput(baseScenario({ scenarioName: "   " })).success).toBe(false);
  });

  it("rejects non-365 periodDays", () => {
    expect(safeParseScenarioInput(baseScenario({ periodDays: 364 })).success).toBe(false);
  });

  it("rejects negative annual CO₂ (kt/year)", () => {
    expect(
      safeParseScenarioInput(
        baseScenario({
          co2: {
            annualAmountKtPerYear: -0.001,
            utilizationRatePct: 50,
            availability: { mode: "flat_annual" },
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects non-finite annual CO₂ (kt/year)", () => {
    expect(
      safeParseScenarioInput(
        baseScenario({
          co2: {
            annualAmountKtPerYear: Number.POSITIVE_INFINITY,
            utilizationRatePct: 50,
            availability: { mode: "flat_annual" },
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects negative hydrogen price", () => {
    expect(
      safeParseScenarioInput(
        baseScenario({
          economics: {
            methanePriceEurPerTch4: 1,
            hydrogenPriceEurPerKg: -1,
            otherOpexEurPerYear: 0,
            includeCapex: false,
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects empty assumptionsVersion", () => {
    expect(
      safeParseScenarioInput(
        baseScenario({
          assumptionsMeta: { assumptionsVersion: "" },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects CAPEX enabled with zero lifetime", () => {
    expect(
      safeParseScenarioInput(
        baseScenario({
          economics: {
            methanePriceEurPerTch4: 1,
            hydrogenPriceEurPerKg: 1,
            otherOpexEurPerYear: 0,
            includeCapex: true,
            electrolyzerCapexEur: 1,
            methanationCapexEur: 0,
            capexLifetimeYears: 0,
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects seasonal_daily CO₂ without monthly weights", () => {
    expect(
      co2AvailabilityInputSchema.safeParse({
        mode: "seasonal_daily",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown CO₂ mode string", () => {
    expect(
      co2AvailabilityInputSchema.safeParse({
        mode: "unknown_mode",
      }).success,
    ).toBe(false);
  });

  it("rejects constant electricity without price field", () => {
    expect(
      electricityPriceInputSchema.safeParse({
        mode: "constant",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown electricity payload shape", () => {
    expect(
      electricityPriceInputSchema.safeParse({
        mode: "unknown",
        priceEurPerMwh: 1,
      }).success,
    ).toBe(false);
  });

  it("rejects strict scenario object with extra top-level keys", () => {
    expect(
      safeParseScenarioInput({
        ...baseScenario(),
        extraField: true,
      }).success,
    ).toBe(false);
  });

  it("accepts legacy wire without plant and without co2.marketPurchase", () => {
    const parsed = parseScenarioInput(baseScenario());
    expect(parsed.plant).toBeUndefined();
    expect(parsed.co2.marketPurchase).toBeUndefined();
  });

  it("accepts optional plant with positive and null caps", () => {
    const parsed = parseScenarioInput(
      baseScenario({
        plant: { electrolyzerMaxH2KgPerDay: 500, methanationMaxCh4KgPerDay: null },
      }),
    );
    expect(parsed.plant?.electrolyzerMaxH2KgPerDay).toBe(500);
    expect(parsed.plant?.methanationMaxCh4KgPerDay).toBeNull();
  });

  it("accepts plant with only one cap field (other omitted → unbounded)", () => {
    const onlyH2 = parseScenarioInput(
      baseScenario({
        plant: { electrolyzerMaxH2KgPerDay: 1000 },
      }),
    );
    expect(onlyH2.plant?.electrolyzerMaxH2KgPerDay).toBe(1000);
    expect(onlyH2.plant?.methanationMaxCh4KgPerDay).toBeNull();

    const onlyCh4 = parseScenarioInput(
      baseScenario({
        plant: { methanationMaxCh4KgPerDay: 900 },
      }),
    );
    expect(onlyCh4.plant?.electrolyzerMaxH2KgPerDay).toBeNull();
    expect(onlyCh4.plant?.methanationMaxCh4KgPerDay).toBe(900);
  });

  it("accepts empty plant object (both caps unbounded)", () => {
    const parsed = parseScenarioInput(baseScenario({ plant: {} }));
    expect(parsed.plant?.electrolyzerMaxH2KgPerDay).toBeNull();
    expect(parsed.plant?.methanationMaxCh4KgPerDay).toBeNull();
  });

  it("rejects plant cap zero on either side", () => {
    expect(
      safeParseScenarioInput(
        baseScenario({
          plant: { electrolyzerMaxH2KgPerDay: 0, methanationMaxCh4KgPerDay: null },
        }),
      ).success,
    ).toBe(false);
  });

  it("accepts co2.marketPurchase disabled without price", () => {
    const parsed = parseScenarioInput(
      baseScenario({
        co2: {
          annualAmountKtPerYear: 1,
          utilizationRatePct: 50,
          availability: { mode: "flat_annual" },
          marketPurchase: { mode: "disabled" as const },
        },
      }),
    );
    expect(parsed.co2.marketPurchase?.mode).toBe("disabled");
  });

  it("requires purchasePriceEurPerTco2 when marketPurchase mode is enabled", () => {
    expect(
      safeParseScenarioInput(
        baseScenario({
          co2: {
            annualAmountKtPerYear: 1,
            utilizationRatePct: 50,
            availability: { mode: "flat_annual" },
            marketPurchase: { mode: "enabled" as const },
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("accepts enabled marketPurchase with non-negative price", () => {
    const parsed = parseScenarioInput(
      baseScenario({
        co2: {
          annualAmountKtPerYear: 1,
          utilizationRatePct: 50,
          availability: { mode: "flat_annual" },
          marketPurchase: { mode: "enabled" as const, purchasePriceEurPerTco2: 0 },
        },
      }),
    );
    expect(parsed.co2.marketPurchase).toEqual({ mode: "enabled", purchasePriceEurPerTco2: 0 });
  });
});

describe("buildSeasonalDailyCo2ProfileKg", () => {
  it("produces 365 rows", () => {
    const profile = buildSeasonalDailyCo2ProfileKg({
      annualCo2Kg: 1_000_000,
      monthlyRelativeWeights: [...equalSeasonalWeights],
    });
    expect(profile).toHaveLength(365);
  });

  it("preserves annual mass total (reconciliation on last day)", () => {
    const annualKt = 2.5;
    const annualKg = annualCo2KtPerYearToKgPerYear(annualKt);
    const profile = buildSeasonalDailyCo2ProfileKg({
      annualCo2Kg: annualKg,
      monthlyRelativeWeights: [3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4],
    });
    const sum = profile.reduce((a, p) => a + p.availableCO2Kg, 0);
    expect(sum).toBeCloseTo(annualKg, 6);
  });

  it("assigns uniform months to equal weights (January mass check)", () => {
    const annualKg = 12 * 31 * 1000;
    const profile = buildSeasonalDailyCo2ProfileKg({
      annualCo2Kg: annualKg,
      monthlyRelativeWeights: [...equalSeasonalWeights],
    });
    const january = profile.filter((p) => p.monthIndex === 0);
    expect(january).toHaveLength(31);
    for (const row of january) {
      expect(row.availableCO2Kg).toBeCloseTo(1000, 10);
    }
  });
});
