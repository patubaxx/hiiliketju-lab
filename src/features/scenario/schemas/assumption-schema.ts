import * as z from "zod";

export const assumptionSourceSchema = z.enum([
  "customer_provided",
  "product_locked",
  "literature_based",
  "placeholder",
  "derived",
]);

export const assumptionStatusSchema = z.enum([
  "confirmed",
  "estimated",
  "pending_customer_confirmation",
  "placeholder_only",
]);

export const assumptionMetaSchema = z.object({
  assumptionSource: assumptionSourceSchema,
  assumptionStatus: assumptionStatusSchema,
  assumptionNote: z.string().optional(),
});

export const assumptionValueNumberSchema = z.object({
  value: z
    .number("Value must be a number")
    .finite("Value must be a finite number"),
  assumptionMeta: assumptionMetaSchema,
});

export type AssumptionMetaParsed = z.infer<typeof assumptionMetaSchema>;
export type AssumptionValueNumberParsed = z.infer<typeof assumptionValueNumberSchema>;
