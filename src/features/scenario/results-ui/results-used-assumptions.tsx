"use client";

import { usedAssumptionsToPrintable } from "@/core/reporting/build-used-assumptions-model";
import type { UsedAssumptionGroupId } from "@/core/reporting/build-used-assumptions-model";
import type { CalculationResult } from "@/core/domain/result";

import type { Locale } from "@/i18n/messages";
import { cn } from "@/lib/utils";

type TFn = (id: string, vars?: Record<string, string>) => string;

const GROUP_ORDER: readonly UsedAssumptionGroupId[] = [
  "scenario",
  "co2",
  "electricity",
  "economics",
  "capex",
  "process",
];

function kindBadgeClass(): string {
  return "inline-block rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground";
}

export function ResultsUsedAssumptions({
  result,
  locale,
  t,
}: {
  readonly result: CalculationResult;
  readonly locale: Locale;
  readonly t: TFn;
}) {
  const flat = usedAssumptionsToPrintable(result, locale);
  const byGroup = new Map<UsedAssumptionGroupId, typeof flat>();
  for (const g of GROUP_ORDER) {
    byGroup.set(
      g,
      flat.filter((r) => r.groupId === g),
    );
  }

  return (
    <section data-testid="results-used-assumptions" aria-labelledby="results-used-assumptions-heading">
      <details
        className={cn(
          "group rounded-xl border border-border/55 bg-card/30 shadow-[var(--shadow-tile)] dark:border-border/50 dark:bg-card/18",
        )}
      >
        <summary
          id="results-used-assumptions-heading"
          className="cursor-pointer list-none px-4 py-3.5 text-base font-semibold tracking-tight text-foreground outline-none marker:content-none [&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 sm:px-5"
        >
          <span className="flex items-center justify-between gap-3">
            <span>{t("results.section.usedAssumptions")}</span>
            <span className="text-xs font-normal text-muted-foreground" aria-hidden>
              ▾
            </span>
          </span>
        </summary>
        <div className="space-y-8 border-t border-border/50 px-4 py-5 sm:px-5">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("results.usedAssumptions.lead")}</p>
          {GROUP_ORDER.map((gid) => {
            const rows = byGroup.get(gid) ?? [];
            if (rows.length === 0) return null;
            return (
              <div key={gid} className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">
                  {t(`results.usedAssumptions.group.${gid}`)}
                </h4>
                <div className="overflow-x-auto rounded-lg border border-border/55 bg-background/40 shadow-[var(--shadow-tile)] dark:bg-background/15">
                  <table className="w-full min-w-[32rem] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border/70 bg-muted/35 text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2 font-medium">{t("results.usedAssumptions.colLabel")}</th>
                        <th className="px-3 py-2 font-medium">{t("results.usedAssumptions.colValue")}</th>
                        <th className="hidden px-3 py-2 font-medium sm:table-cell">{t("results.usedAssumptions.colMeta")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr
                          key={`${gid}-${i}-${r.label}`}
                          className="border-b border-border/40 last:border-b-0"
                        >
                          <td className="px-3 py-2 align-top text-foreground/95">{r.label}</td>
                          <td className="px-3 py-2 align-top font-mono text-xs tabular-nums text-foreground sm:text-sm">
                            {r.value}
                          </td>
                          <td className="hidden max-w-sm px-3 py-2 align-top text-xs text-muted-foreground sm:table-cell">
                            {r.kind ? (
                              <span className={kindBadgeClass()}>
                                {r.kind === "derived"
                                  ? t("results.usedAssumptions.kind.derived")
                                  : r.kind === "imported_data"
                                    ? t("results.usedAssumptions.kind.imported")
                                    : r.kind === "user_input"
                                      ? t("results.usedAssumptions.kind.user")
                                      : t("results.usedAssumptions.kind.default")}
                              </span>
                            ) : null}
                            {r.source ? (
                              <div className="mt-1">
                                <span className="text-foreground/80">{t("results.assumptions.source")}:</span> {r.source}
                              </div>
                            ) : null}
                            {r.status ? (
                              <div>
                                <span className="text-foreground/80">{t("results.assumptions.status")}:</span> {r.status}
                              </div>
                            ) : null}
                            {r.note ? <p className="mt-1 text-foreground/85">{r.note}</p> : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
