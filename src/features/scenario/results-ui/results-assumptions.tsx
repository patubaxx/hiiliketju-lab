import type { ProcessAssumptionsInput } from "@/core/domain/assumptions";
import { USER_FACING_EXPORT_PROCESS_ASSUMPTION_KEYS } from "@/core/domain/user-facing-process-assumptions";
import { PROCESS_FIELD_ORDER } from "@/features/scenario/input-ui/form-state";

import { formatResultNumber } from "./format-result-values";

import type { Locale } from "@/i18n/messages";

type TFn = (id: string, vars?: Record<string, string>) => string;

const SHOWN_IN_RESULTS = new Set<string>(USER_FACING_EXPORT_PROCESS_ASSUMPTION_KEYS);

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
    <section className="space-y-5 border-t border-border/70 pt-10" aria-labelledby="results-assumptions-heading">
      <h3 id="results-assumptions-heading" className="text-base font-semibold tracking-tight text-foreground">
        {t("results.section.assumptions")}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {PROCESS_FIELD_ORDER.filter(({ key }) => SHOWN_IN_RESULTS.has(key)).map(({ key, labelId }) => {
          const field = process[key];
          const meta = field.assumptionMeta;
          const lit = meta.assumptionSource === "literature_based";
          return (
            <div
              key={key}
              className={`rounded-xl border px-4 py-4 shadow-sm ${literatureClass(meta.assumptionSource)}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">{t(labelId)}</h4>
                {lit ? (
                  <span className="rounded-md border border-amber-600/35 bg-amber-500/12 px-2 py-0.5 text-xs font-medium text-amber-950 dark:text-amber-100">
                    {t("results.assumptions.literatureBadge")}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
                {formatResultNumber(field.value, locale, { maximumFractionDigits: 6 })}
              </p>
              <dl className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <dt className="shrink-0 font-medium text-foreground/85">{t("results.assumptions.source")}</dt>
                  <dd>{t(`assumptionSource.${meta.assumptionSource}`)}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <dt className="shrink-0 font-medium text-foreground/85">{t("results.assumptions.status")}</dt>
                  <dd>{t(`assumptionStatus.${meta.assumptionStatus}`)}</dd>
                </div>
                {meta.assumptionNote ? (
                  <div>
                    <dt className="font-medium text-foreground/85">{t("results.assumptions.note")}</dt>
                    <dd className="mt-0.5 text-[0.8125rem] leading-snug text-foreground/90">{meta.assumptionNote}</dd>
                  </div>
                ) : null}
              </dl>
              <details className="mt-3 border-t border-border/60 pt-3 text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  {t("advanced.internalKey")}
                </summary>
                <p className="mt-1.5 break-all font-mono text-[0.65rem] leading-relaxed text-muted-foreground">{key}</p>
              </details>
            </div>
          );
        })}
      </div>
    </section>
  );
}
