/**
 * Unit vocabulary for public contracts and documentation.
 * Conversions live in the calculation layer (Agent 2); this file names units only.
 */

/** User-facing annual CO₂ availability (locked MVP: kt/year). */
export type Co2MassFlowAnnualKtPerYear = {
  readonly unit: "kt_per_year";
  readonly value: number;
};

/** Internal / resolved CO₂ timestep (locked MVP: kg/day). */
export type Co2MassFlowKgPerDay = {
  readonly unit: "kg_per_day";
  readonly value: number;
};

/** Electricity price (locked MVP: EUR/MWh). */
export type ElectricityPriceEurPerMwh = {
  readonly unit: "eur_per_mwh";
  readonly value: number;
};

/** Hydrogen sales price for Path B (locked MVP: EUR/kg_H2). */
export type HydrogenPriceEurPerKg = {
  readonly unit: "eur_per_kg_h2";
  readonly value: number;
};

/** Methane sales price (locked MVP: EUR/t_CH4). */
export type MethanePriceEurPerTch4 = {
  readonly unit: "eur_per_t_ch4";
  readonly value: number;
};

/** Other OPEX (calc spec: EUR/year). */
export type AnnualEuroAmount = {
  readonly unit: "eur_per_year";
  readonly value: number;
};

/** CAPEX lump sums (calc spec: EUR). */
export type CapexEuroAmount = {
  readonly unit: "eur";
  readonly value: number;
};

/** Percentage 0–100 as stored in inputs. */
export type Percent0to100 = {
  readonly unit: "percent";
  readonly value: number;
};

/** Electrical energy (timestep magnitude documented at use site). */
export type EnergyMwh = {
  readonly unit: "mwh";
  readonly value: number;
};

/** CH₄ mass for annual business reporting (locked MVP: t/year at summary level). */
export type MethaneMassTonnesPerYear = {
  readonly unit: "t_ch4_per_year";
  readonly value: number;
};

/** H₂ mass (locked MVP: kg). */
export type HydrogenMassKg = {
  readonly unit: "kg_h2";
  readonly value: number;
};

/** Convert kt/year to kg/year (1 kt = 1_000_000 kg). Pure helper for Agent 1 / 2 boundaries. */
export function annualCo2KtPerYearToKgPerYear(ktPerYear: number): number {
  return ktPerYear * 1_000_000;
}
