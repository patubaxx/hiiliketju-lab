/**
 * Electricity price branch validation: constant, daily 365, hourly 8760, or imported daily/hourly (`resolution` selects length).
 */
import * as z from "zod";

import { SCENARIO_HOURLY_SLOTS, SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

const nonNegativeFinite = z
  .number("validation.zod.mustBeNumber")
  .finite("validation.zod.mustBeFiniteNumber")
  .min(0, "validation.zod.cannotBeNegative");

/** EUR/MWh series may include negative spot / market prices; constant mode stays non-negative. */
const finiteSeriesElement = z
  .number("validation.zod.mustBeNumber")
  .finite("validation.zod.mustBeFiniteNumber");

const dailyPriceSeriesSchema = z
  .array(finiteSeriesElement)
  .length(SCENARIO_PERIOD_DAYS, "validation.zod.electricityDailySeriesLength");

const hourlyPriceSeriesSchema = z
  .array(finiteSeriesElement)
  .length(SCENARIO_HOURLY_SLOTS, "validation.zod.electricityHourlySeriesLength");

/**
 * Union (not `discriminatedUnion`) because `historical_market_data_imported` also
 * discriminates on `resolution` (daily vs hourly series length).
 */
export const electricityPriceInputSchema = z.union([
  z.object({
    mode: z.literal("constant"),
    priceEurPerMwh: nonNegativeFinite,
  }),
  z.object({
    mode: z.literal("daily_series"),
    dailyPricesEurPerMwh: dailyPriceSeriesSchema,
  }),
  z.object({
    mode: z.literal("hourly_series"),
    hourlyPricesEurPerMwh: hourlyPriceSeriesSchema,
  }),
  z.object({
    mode: z.literal("historical_market_data_imported"),
    resolution: z.literal("daily"),
    pricesEurPerMwh: dailyPriceSeriesSchema,
  }),
  z.object({
    mode: z.literal("historical_market_data_imported"),
    resolution: z.literal("hourly"),
    pricesEurPerMwh: hourlyPriceSeriesSchema,
  }),
]);

export type ElectricityPriceInputParsed = z.infer<typeof electricityPriceInputSchema>;
