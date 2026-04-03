import type { CalculationResult } from "@/core/domain/result";

type TFn = (id: string, vars?: Record<string, string>) => string;

export function ResultsWarnings({ result, t }: { result: CalculationResult; t: TFn }) {
  const items = result.warnings;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-labelledby="results-warnings-heading">
      <h3 id="results-warnings-heading" className="text-sm font-semibold tracking-tight text-foreground">
        {t("results.section.warnings")}
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("results.warnings.empty")}</p>
      ) : (
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-foreground/90">
          {items.map((w, i) => (
            <li key={i} className="pl-0.5 font-mono text-[0.8rem] leading-relaxed">
              {w}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
