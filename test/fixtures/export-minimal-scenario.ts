/** Wire JSON shape accepted by `safeParseScenarioInput` / export API (365-day MVP). */
export function minimalExportScenarioWire() {
  return {
    scenarioName: "API export test",
    periodDays: 365,
    co2: {
      annualAmountKtPerYear: 0.365,
      utilizationRatePct: 100,
      availability: { mode: "flat_annual" as const },
    },
    electricity: { mode: "constant" as const, priceEurPerMwh: 10 },
    economics: {
      methanePriceEurPerTch4: 100,
      hydrogenPriceEurPerKg: 2,
      otherOpexEurPerYear: 0,
      includeCapex: false,
    },
    assumptionsMeta: { assumptionsVersion: "export_api_test" },
    process: {},
  };
}
