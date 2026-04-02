/**
 * Lightweight unit vocabulary for inputs/outputs. Not a conversion engine.
 * TODO(unit-decision): Lock internal vs display units when formulas are fixed.
 */

/** User-facing annual CO₂ availability (solution spec: t/year). */
export type Co2MassFlowAnnual = { readonly unit: "t_per_year"; readonly value: number };

/** Electricity price (locked MVP: €/MWh). */
export type ElectricityPrice = { readonly unit: "eur_per_mwh"; readonly value: number };

/** Hydrogen value for alternative path (calc spec: €/kg). */
export type HydrogenPrice = { readonly unit: "eur_per_kg"; readonly value: number };

/** Other OPEX (calc spec: €/year). */
export type AnnualEuroAmount = { readonly unit: "eur_per_year"; readonly value: number };

/** CAPEX lump sum (calc spec: €). */
export type CapexAmount = { readonly unit: "eur"; readonly value: number };

/** Percentage 0–100 as displayed/stored in inputs. */
export type Percent0to100 = { readonly unit: "percent"; readonly value: number };

/**
 * Methane price/value unit is not locked in the formula package yet.
 * Use this tag so values are not mistaken for finalized €/kg (or other) semantics.
 */
export type MethaneValueUnit = "TODO_customer_formula_unit";

export type MethanePricePlaceholder = {
  readonly unit: MethaneValueUnit;
  readonly value: number;
};

/** Default business-readable methane quantity for MVP reporting (AGENTS.md). */
export type MethaneMassUnit = "kg";

/** Hydrogen mass (calc / solution conventions). */
export type HydrogenMassUnit = "kg";

/** Electrical energy (annual/daily as documented on each field). */
export type EnergyMwh = { readonly unit: "mwh"; readonly value: number };
