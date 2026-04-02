import * as z from "zod";

import { SCENARIO_PERIOD_DAYS } from "@/core/domain/scenario";

import { availabilityProfileInputSchema } from "./availability-profile-schema";

export const scenarioInputSchema = z.object({
  scenarioName: z.string().trim().min(1, "Scenario name is required"),
  periodDays: z.literal(
    SCENARIO_PERIOD_DAYS,
    "Calculation period must be 365 days in MVP",
  ),
  co2: z.object({
    annualAmountTons: z
      .number("Annual CO₂ amount must be a number")
      .min(0, "Annual CO₂ amount cannot be negative"),
    utilizationRatePct: z
      .number("Utilization rate must be a number")
      .min(0, "Utilization rate must be between 0 and 100")
      .max(100, "Utilization rate must be between 0 and 100"),
    availabilityProfile: availabilityProfileInputSchema,
  }),
  energy: z.object({
    electricityPriceEurPerMWh: z
      .number("Electricity price must be a number")
      .min(0, "Electricity price cannot be negative"),
  }),
  economics: z.object({
    /** Unit not locked — only structural validation (finite number). */
    methanePrice: z.number("Methane price must be a number"),
    hydrogenPriceEurPerKg: z
      .number("Hydrogen price must be a number")
      .min(0, "Hydrogen price cannot be negative"),
    otherOpexEurPerYear: z
      .number("Other OPEX must be a number")
      .min(0, "Other OPEX cannot be negative")
      .default(0),
    capexEur: z.number("CAPEX must be a number").min(0, "CAPEX cannot be negative"),
    capexLifetimeYears: z
      .number("CAPEX lifetime must be a number")
      .positive("CAPEX lifetime must be greater than zero"),
    discountRatePct: z
      .number("Discount rate must be a number")
      .min(0, "Discount rate cannot be negative")
      .max(100, "Discount rate cannot exceed 100%"),
    capexAnnualizationMethod: z.literal(
      "annuity",
      "CAPEX annualization must use the annuity method in MVP",
    ),
  }),
  process: z.object({
    methaneConversionParams: z
      .record(z.string(), z.number("Process parameter must be a number"))
      .default({}),
    hydrogenDemandParams: z
      .record(z.string(), z.number("Process parameter must be a number"))
      .default({}),
    energyConsumptionParams: z
      .record(z.string(), z.number("Process parameter must be a number"))
      .default({}),
    plantAvailabilityPct: z
      .number("Plant availability must be a number")
      .min(0, "Plant availability must be between 0 and 100")
      .max(100, "Plant availability must be between 0 and 100")
      .optional(),
    processEfficiencyPct: z
      .number("Process efficiency must be a number")
      .min(0, "Process efficiency must be between 0 and 100")
      .max(100, "Process efficiency must be between 0 and 100")
      .optional(),
  }),
  assumptionsMeta: z.object({
    assumptionsVersion: z.string().trim().min(1, "Assumptions version is required"),
    notes: z.string().optional(),
  }),
});

export type ScenarioInputParsed = z.infer<typeof scenarioInputSchema>;

export function parseScenarioInput(data: unknown): ScenarioInputParsed {
  return scenarioInputSchema.parse(data);
}

export function safeParseScenarioInput(data: unknown) {
  return scenarioInputSchema.safeParse(data);
}
