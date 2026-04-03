/**
 * CO₂ temporal availability validation (mode-based contract).
 * Implementation lives in `co2-availability-schema.ts`; this barrel keeps the
 * scenario feature folder aligned with the WP3 layout.
 */
export {
  co2AvailabilityInputSchema,
  monthlyRelativeWeights12Schema,
  type Co2AvailabilityInputParsed,
} from "./co2-availability-schema";
