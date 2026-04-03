import type { CalculationResult } from "@/core/domain/result";

type TFn = (id: string, vars?: Record<string, string>) => string;

export function ResultsWarnings({ result, t }: { result: CalculationResult; t: TFn }) {
  const items = result.warnings;

  return (
    <section
      className="rounded-xl border border-border bg-card px-5 py-5 shadow-sm"
      aria-labelledby="results-warnings-heading"
    >
      <h3 id="results-warnings-heading" className="text-base font-semibold tracking-tight text-foreground">
        {t("results.section.warnings")}
      </h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("results.warnings.empty")}</p>
      ) : (
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-foreground/90">
          {items.map((w, i) => (
            <li key={i} className="marker:text-muted-foreground">
              {w}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
