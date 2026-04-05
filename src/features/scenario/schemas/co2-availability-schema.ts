/**
 * CO₂ availability branch validation: mode discriminant plus 12-tuple weights or fixed-length daily/hourly series.
 */
import * as z from "zod";

import { SCENARIO_HOURLY_SLOTS, SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

const nonNegativeFinite = z
  .number("validation.zod.mustBeNumber")
  .finite("validation.zod.mustBeFiniteNumber")
  .min(0, "validation.zod.cannotBeNegative");

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
    message: "validation.zod.seasonalWeightsNotAllZero",
  });

const dailyCo2SeriesSchema = z
  .array(nonNegativeFinite)
  .length(SCENARIO_PERIOD_DAYS, "validation.zod.co2DailySeriesLength");

const hourlyCo2SeriesSchema = z
  .array(nonNegativeFinite)
  .length(SCENARIO_HOURLY_SLOTS, "validation.zod.co2HourlySeriesLength");

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
