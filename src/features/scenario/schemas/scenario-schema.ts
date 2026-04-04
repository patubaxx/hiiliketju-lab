/**
 * Authoritative Zod schema for `ScenarioInput` wire JSON: same contract for the interactive form and `/api/export/*`.
 * `parseScenarioInput` / `safeParseScenarioInput` return typed data; `mergeProcessAssumptionsInput` fills omitted process fields.
 */
import * as z from "zod";

import { mergeProcessAssumptionsInput, type ScenarioInput } from "@/core/domain/scenario";
import { SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

import { assumptionValueNumberSchema } from "./assumption-schema";
import { co2AvailabilityInputSchema } from "./co2-availability-schema";
import { electricityPriceInputSchema } from "./electricity-price-schema";

const processAssumptionsPartialSchema = z
  .object({
    stoichiometricHydrogenDemandFactorKgH2PerKgCo2: assumptionValueNumberSchema.optional(),
    stoichiometricMethaneYieldFactorKgCh4PerKgCo2: assumptionValueNumberSchema.optional(),
    electrolyzerSpecificEnergyConsumptionKwhPerKgH2: assumptionValueNumberSchema.optional(),
    electrolyzerSpecificEnergyConsumptionMwhPerKgH2: assumptionValueNumberSchema.optional(),
    plantAvailabilityPct: assumptionValueNumberSchema.optional(),
    processEfficiencyPct: assumptionValueNumberSchema.optional(),
  })
  .strict();

export const scenarioInputSchema = z
  .object({
    scenarioName: z.string().trim().min(1, "Scenario name is required"),
    periodDays: z.literal(SCENARIO_PERIOD_DAYS, {
      error: `Calculation period must be exactly ${SCENARIO_PERIOD_DAYS} days in MVP`,
    }),
    co2: z.object({
      annualAmountKtPerYear: z
        .number("Annual CO₂ must be a number")
        .finite("Annual CO₂ must be a finite number")
        .min(0, "Annual CO₂ (kt/year) cannot be negative"),
      utilizationRatePct: z
        .number("Utilization rate must be a number")
        .finite("Utilization rate must be a finite number")
        .min(0, "Utilization rate must be between 0 and 100")
        .max(100, "Utilization rate must be between 0 and 100"),
      availability: co2AvailabilityInputSchema,
    }),
    electricity: electricityPriceInputSchema,
    economics: z
      .object({
        methanePriceEurPerTch4: z
          .number("Methane price must be a number")
          .finite("Methane price must be a finite number")
          .min(0, "Methane price (EUR/t_CH4) cannot be negative"),
        hydrogenPriceEurPerKg: z
          .number("Hydrogen price must be a number")
          .finite("Hydrogen price must be a finite number")
          .min(0, "Hydrogen price (EUR/kg_H2) cannot be negative"),
        otherOpexEurPerYear: z
          .number("Other OPEX must be a number")
          .finite("Other OPEX must be a finite number")
          .min(0, "Other OPEX cannot be negative")
          .default(0),
        includeCapex: z.boolean(),
        electrolyzerCapexEur: z
          .number("Electrolyzer CAPEX must be a number")
          .finite("Electrolyzer CAPEX must be a finite number")
          .min(0, "Electrolyzer CAPEX cannot be negative")
          .optional(),
        methanationCapexEur: z
          .number("Methanation CAPEX must be a number")
          .finite("Methanation CAPEX must be a finite number")
          .min(0, "Methanation CAPEX cannot be negative")
          .optional(),
        capexLifetimeYears: z
          .number("CAPEX lifetime must be a number")
          .finite("CAPEX lifetime must be a finite number")
          .positive("CAPEX lifetime must be greater than zero")
          .optional(),
      })
      .superRefine((data, ctx) => {
        if (!data.includeCapex) return;
        if (data.electrolyzerCapexEur === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "electrolyzerCapexEur is required when includeCapex is true",
            path: ["electrolyzerCapexEur"],
          });
        }
        if (data.methanationCapexEur === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "methanationCapexEur is required when includeCapex is true",
            path: ["methanationCapexEur"],
          });
        }
        if (data.capexLifetimeYears === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "capexLifetimeYears is required when includeCapex is true",
            path: ["capexLifetimeYears"],
          });
        }
      }),
    process: processAssumptionsPartialSchema.default({}),
    assumptionsMeta: z.object({
      assumptionsVersion: z.string().trim().min(1, "Assumptions version is required"),
      notes: z.string().optional(),
    }),
  })
  .strict();

export type ScenarioInputParsed = z.infer<typeof scenarioInputSchema>;

export function parseScenarioInput(data: unknown): ScenarioInput {
  const parsed = scenarioInputSchema.parse(data);
  return {
    ...parsed,
    process: mergeProcessAssumptionsInput(parsed.process),
  };
}

export function safeParseScenarioInput(data: unknown) {
  return scenarioInputSchema.safeParse(data);
}
