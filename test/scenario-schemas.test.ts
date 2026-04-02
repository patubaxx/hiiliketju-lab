import { describe, expect, it } from "vitest";

import { PROFILE_MODE_MONTHLY_WEIGHTED } from "@/core/domain/scenario";
import {
  availabilityProfileInputSchema,
  monthlyWeights12Schema,
} from "@/features/scenario/schemas/availability-profile-schema";
import { parseScenarioInput, safeParseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

const validWeights = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as const;

function baseScenario(overrides?: Record<string, unknown>) {
  return {
    scenarioName: "Test scenario",
    periodDays: 365,
    co2: {
      annualAmountTons: 1000,
      utilizationRatePct: 50,
      availabilityProfile: {
        mode: PROFILE_MODE_MONTHLY_WEIGHTED,
        monthlyWeights: [...validWeights],
      },
    },
    energy: {
      electricityPriceEurPerMWh: 80,
    },
    economics: {
      methanePrice: 0,
      hydrogenPriceEurPerKg: 5,
      otherOpexEurPerYear: 0,
      capexEur: 1_000_000,
      capexLifetimeYears: 20,
      discountRatePct: 5,
      capexAnnualizationMethod: "annuity" as const,
    },
    process: {},
    assumptionsMeta: {
      assumptionsVersion: "HIILIKETJU_ASSUMPTIONS_v1_2026-04",
    },
    ...overrides,
  };
}

describe("monthlyWeights12Schema", () => {
  it("accepts a valid 12-month profile with zeros allowed", () => {
    const weights = [2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as const;
    const result = monthlyWeights12Schema.safeParse(weights);
    expect(result.success).toBe(true);
  });

  it("rejects wrong-length monthly weights", () => {
    const result = monthlyWeights12Schema.safeParse([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(result.success).toBe(false);
  });

  it("rejects negative monthly weights", () => {
    const bad = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -0.01] as const;
    const result = monthlyWeights12Schema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects all-zero monthly weights", () => {
    const zeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as const;
    const result = monthlyWeights12Schema.safeParse(zeros);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("all be zero"))).toBe(true);
    }
  });
});

describe("availabilityProfileInputSchema", () => {
  it("parses a valid monthly_weighted profile", () => {
    const parsed = availabilityProfileInputSchema.parse({
      mode: PROFILE_MODE_MONTHLY_WEIGHTED,
      monthlyWeights: [...validWeights],
    });
    expect(parsed.mode).toBe(PROFILE_MODE_MONTHLY_WEIGHTED);
    expect(parsed.monthlyWeights).toHaveLength(12);
  });
});

describe("scenarioInputSchema", () => {
  it("accepts a valid full scenario input", () => {
    const parsed = parseScenarioInput(baseScenario());
    expect(parsed.scenarioName).toBe("Test scenario");
    expect(parsed.periodDays).toBe(365);
    expect(parsed.co2.availabilityProfile.monthlyWeights).toHaveLength(12);
  });

  it("rejects utilization rate below 0", () => {
    const result = safeParseScenarioInput(
      baseScenario({
        co2: {
          annualAmountTons: 100,
          utilizationRatePct: -1,
          availabilityProfile: {
            mode: PROFILE_MODE_MONTHLY_WEIGHTED,
            monthlyWeights: [...validWeights],
          },
        },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects utilization rate above 100", () => {
    const result = safeParseScenarioInput(
      baseScenario({
        co2: {
          annualAmountTons: 100,
          utilizationRatePct: 100.01,
          availabilityProfile: {
            mode: PROFILE_MODE_MONTHLY_WEIGHTED,
            monthlyWeights: [...validWeights],
          },
        },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects NaN in required numeric fields", () => {
    const result = safeParseScenarioInput(
      baseScenario({
        energy: { electricityPriceEurPerMWh: Number.NaN },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects invalid monthly weight array on nested profile", () => {
    const result = safeParseScenarioInput(
      baseScenario({
        co2: {
          annualAmountTons: 100,
          utilizationRatePct: 10,
          availabilityProfile: {
            mode: PROFILE_MODE_MONTHLY_WEIGHTED,
            monthlyWeights: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          },
        },
      }),
    );
    expect(result.success).toBe(false);
  });
});
