import type { ProcessAssumptionsInput } from "@/core/domain/assumptions";
import { PROCESS_FIELD_ORDER } from "@/features/scenario/input-ui/form-state";

import { formatResultNumber } from "./format-result-values";

import type { Locale } from "@/i18n/messages";

type TFn = (id: string, vars?: Record<string, string>) => string;

function literatureClass(source: string): string {
  return source === "literature_based"
    ? "border-amber-500/40 bg-amber-500/[0.06]"
    : "border-border bg-muted/30";
}

export function ResultsAssumptions({
  process,
  locale,
  t,
}: {
  readonly process: ProcessAssumptionsInput;
  readonly locale: Locale;
  readonly t: TFn;
}) {
  return (
    <section className="space-y-3" aria-labelledby="results-assumptions-heading">
      <h2 id="results-assumptions-heading" className="text-sm font-semibold tracking-tight text-foreground">
        {t("results.section.assumptions")}
      </h2>
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.04] px-3 py-2 text-xs text-foreground/90">
        <p className="font-medium text-amber-950 dark:text-amber-100">{t("advanced.inactiveFactorsTitle")}</p>
        <p className="mt-1 text-muted-foreground">{t("advanced.inactiveFactorsBody")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {PROCESS_FIELD_ORDER.map(({ key, labelId }) => {
          const field = process[key];
          const meta = field.assumptionMeta;
          const lit = meta.assumptionSource === "literature_based";
          return (
            <div
              key={key}
              className={`rounded-xl border p-4 shadow-sm ${literatureClass(meta.assumptionSource)}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium text-foreground">{t(labelId)}</h3>
                {lit ? (
                  <span className="rounded-md border border-amber-600/30 bg-amber-500/10 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-amber-900 dark:text-amber-200">
                    {t("results.assumptions.literatureBadge")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
                {formatResultNumber(field.value, locale, { maximumFractionDigits: 6 })}
              </p>
              <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-foreground/80">{t("results.assumptions.source")}</dt>
                  <dd>{t(`assumptionSource.${meta.assumptionSource}`)}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-foreground/80">{t("results.assumptions.status")}</dt>
                  <dd>{t(`assumptionStatus.${meta.assumptionStatus}`)}</dd>
                </div>
                {meta.assumptionNote ? (
                  <div>
                    <dt className="font-medium text-foreground/80">{t("results.assumptions.note")}</dt>
                    <dd className="mt-0.5 text-[0.7rem] leading-snug text-foreground/85">{meta.assumptionNote}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}
