/**
 * Electricity price branch validation: constant, daily 365, hourly 8760, or imported daily/hourly (`resolution` selects length).
 */
import * as z from "zod";

import { SCENARIO_HOURLY_SLOTS, SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

const nonNegativeFinite = z
  .number("Must be a number")
  .finite("Must be a finite number")
  .min(0, "Cannot be negative");

/** EUR/MWh series may include negative spot / market prices; constant mode stays non-negative. */
const finiteSeriesElement = z.number("Must be a number").finite("Must be a finite number");

const dailyPriceSeriesSchema = z
  .array(finiteSeriesElement)
  .length(
    SCENARIO_PERIOD_DAYS,
    `dailyPricesEurPerMwh must have exactly ${SCENARIO_PERIOD_DAYS} values`,
  );

const hourlyPriceSeriesSchema = z
  .array(finiteSeriesElement)
  .length(
    SCENARIO_HOURLY_SLOTS,
    `hourlyPricesEurPerMwh must have exactly ${SCENARIO_HOURLY_SLOTS} values`,
  );

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
