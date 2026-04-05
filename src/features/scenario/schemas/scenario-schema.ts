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
    scenarioName: z.string().trim().min(1, "validation.zod.scenarioNameRequired"),
    periodDays: z.literal(SCENARIO_PERIOD_DAYS, "validation.zod.periodDaysMvp"),
    co2: z.object({
      annualAmountKtPerYear: z
        .number("validation.zod.annualCo2MustBeNumber")
        .finite("validation.zod.annualCo2MustBeFinite")
        .min(0, "validation.zod.annualCo2NonNegative"),
      utilizationRatePct: z
        .number("validation.zod.utilizationMustBeNumber")
        .finite("validation.zod.utilizationMustBeFinite")
        .min(0, "validation.zod.utilizationOutOfRange")
        .max(100, "validation.zod.utilizationOutOfRange"),
      availability: co2AvailabilityInputSchema,
    }),
    electricity: electricityPriceInputSchema,
    economics: z
      .object({
        methanePriceEurPerTch4: z
          .number("validation.zod.methaneAssumedPriceMustBeNumber")
          .finite("validation.zod.methaneAssumedPriceMustBeFinite")
          .min(0, "validation.zod.methaneAssumedPriceNonNegative"),
        hydrogenPriceEurPerKg: z
          .number("validation.zod.hydrogenAssumedPriceMustBeNumber")
          .finite("validation.zod.hydrogenAssumedPriceMustBeFinite")
          .min(0, "validation.zod.hydrogenAssumedPriceNonNegative"),
        otherOpexEurPerYear: z
          .number("validation.zod.otherOpexMustBeNumber")
          .finite("validation.zod.otherOpexMustBeFinite")
          .min(0, "validation.zod.otherOpexNonNegative")
          .default(0),
        includeCapex: z.boolean(),
        electrolyzerCapexEur: z
          .number("validation.zod.electrolyzerCapexMustBeNumber")
          .finite("validation.zod.electrolyzerCapexMustBeFinite")
          .min(0, "validation.zod.electrolyzerCapexNonNegative")
          .optional(),
        methanationCapexEur: z
          .number("validation.zod.methanationCapexMustBeNumber")
          .finite("validation.zod.methanationCapexMustBeFinite")
          .min(0, "validation.zod.methanationCapexNonNegative")
          .optional(),
        capexLifetimeYears: z
          .number("validation.zod.capexLifetimeMustBeNumber")
          .finite("validation.zod.capexLifetimeMustBeFinite")
          .positive("validation.zod.capexLifetimePositive")
          .optional(),
      })
      .superRefine((data, ctx) => {
        if (!data.includeCapex) return;
        if (data.electrolyzerCapexEur === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "validation.zod.capexElectrolyzerRequiredWhenIncluded",
            path: ["electrolyzerCapexEur"],
          });
        }
        if (data.methanationCapexEur === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "validation.zod.capexMethanationRequiredWhenIncluded",
            path: ["methanationCapexEur"],
          });
        }
        if (data.capexLifetimeYears === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "validation.zod.capexLifetimeRequiredWhenIncluded",
            path: ["capexLifetimeYears"],
          });
        }
      }),
    process: processAssumptionsPartialSchema.default({}),
    assumptionsMeta: z.object({
      assumptionsVersion: z.string().trim().min(1, "validation.zod.assumptionsVersionRequired"),
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
