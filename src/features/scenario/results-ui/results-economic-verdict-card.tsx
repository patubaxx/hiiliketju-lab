"use client";

import { buildEconomicVerdict, type EconomicVerdictCategory } from "@/core/reporting/build-economic-verdict";
import type { CalculationResult } from "@/core/domain/result";

type TFn = (id: string, vars?: Record<string, string>) => string;

function cardClass(category: EconomicVerdictCategory): string {
  if (category === "favorable") {
    return "border-emerald-500/50 bg-emerald-500/[0.07] text-foreground dark:bg-emerald-500/[0.08]";
  }
  if (category === "mixed") {
    return "border-amber-500/45 bg-amber-500/[0.08] text-foreground dark:bg-amber-500/[0.1]";
  }
  if (category === "unfavorable") {
    return "border-red-500/45 bg-red-500/[0.07] text-foreground dark:bg-red-500/[0.08]";
  }
  return "border-border/80 bg-muted/40 text-foreground";
}

export function ResultsEconomicVerdictCard({
  result,
  t,
}: {
  readonly result: CalculationResult;
  readonly t: TFn;
}) {
  const v = buildEconomicVerdict(result.annualSummary);

  return (
    <section
      data-testid="results-verdict-card"
      className={`rounded-xl border p-5 shadow-[var(--shadow-tile)] sm:p-6 ${cardClass(v.category)}`}
      aria-labelledby="results-verdict-heading"
    >
      <h3 id="results-verdict-heading" className="text-base font-semibold tracking-tight text-foreground">
        {t(v.titleKey)}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-foreground/95">{t(v.bodyKey)}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/90">
        {v.detailKeys.map((k) => (
          <li key={k}>
            {t(k)}
          </li>
        ))}
      </ul>
    </section>
  );
}
