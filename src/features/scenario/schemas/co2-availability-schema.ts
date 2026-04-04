/**
 * CO₂ availability branch validation: mode discriminant plus 12-tuple weights or fixed-length daily/hourly series.
 */
import * as z from "zod";

import { SCENARIO_HOURLY_SLOTS, SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

const nonNegativeFinite = z
  .number("Must be a number")
  .finite("Must be a finite number")
  .min(0, "Cannot be negative");

export const monthlyRelativeWeights12Schema = z
  .tuple([
    nonNegativeFinite,
    nonNegativeFinite,
    nonNegativeFinite,
    nonNegativeFinite,
    nonNegativeFinite,
    nonNegativeFinite,
    nonNegativeFinite,
    nonNegativeFinite,
    nonNegativeFinite,
    nonNegativeFinite,
    nonNegativeFinite,
    nonNegativeFinite,
  ])
  .refine((weights) => weights.some((w) => w > 0), {
    message: "Monthly relative weights cannot all be zero",
  });

const dailyCo2SeriesSchema = z
  .array(nonNegativeFinite)
  .length(
    SCENARIO_PERIOD_DAYS,
    `dailyAvailableCo2Kg must have exactly ${SCENARIO_PERIOD_DAYS} values (kg/day)`,
  );

const hourlyCo2SeriesSchema = z
  .array(nonNegativeFinite)
  .length(
    SCENARIO_HOURLY_SLOTS,
    `hourlyAvailableCo2Kg must have exactly ${SCENARIO_HOURLY_SLOTS} values (kg/hour)`,
  );

export const co2AvailabilityInputSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("flat_annual"),
  }),
  z.object({
    mode: z.literal("seasonal_daily"),
    monthlyRelativeWeights: monthlyRelativeWeights12Schema,
  }),
  z.object({
    mode: z.literal("time_series_daily"),
    dailyAvailableCo2Kg: dailyCo2SeriesSchema,
  }),
  z.object({
    mode: z.literal("time_series_hourly"),
    hourlyAvailableCo2Kg: hourlyCo2SeriesSchema,
  }),
]);

export type Co2AvailabilityInputParsed = z.infer<typeof co2AvailabilityInputSchema>;
