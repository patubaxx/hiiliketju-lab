import * as z from "zod";

import { PROFILE_MODE_MONTHLY_WEIGHTED } from "@/core/domain/scenario";

const nonNegativeFiniteWeight = z
  .number("Monthly weight must be a number")
  .min(0, "Monthly weight cannot be negative");

/** Exactly twelve relative weights; not all zeros. */
export const monthlyWeights12Schema = z
  .tuple([
    nonNegativeFiniteWeight,
    nonNegativeFiniteWeight,
    nonNegativeFiniteWeight,
    nonNegativeFiniteWeight,
    nonNegativeFiniteWeight,
    nonNegativeFiniteWeight,
    nonNegativeFiniteWeight,
    nonNegativeFiniteWeight,
    nonNegativeFiniteWeight,
    nonNegativeFiniteWeight,
    nonNegativeFiniteWeight,
    nonNegativeFiniteWeight,
  ])
  .refine((weights) => weights.some((w) => w > 0), {
    message: "Monthly weights cannot all be zero",
  });

export const availabilityProfileInputSchema = z.object({
  mode: z.literal(
    PROFILE_MODE_MONTHLY_WEIGHTED,
    "Only monthly_weighted profile mode is supported in MVP",
  ),
  monthlyWeights: monthlyWeights12Schema,
});

export type AvailabilityProfileInputParsed = z.infer<typeof availabilityProfileInputSchema>;
