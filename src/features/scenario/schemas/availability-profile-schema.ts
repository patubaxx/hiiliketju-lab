/**
 * Re-exports CO₂ availability Zod schemas from `co2-availability-schema.ts` for convenient imports elsewhere
 * in the scenario feature.
 */
export {
  co2AvailabilityInputSchema,
  monthlyRelativeWeights12Schema,
  type Co2AvailabilityInputParsed,
} from "./co2-availability-schema";
