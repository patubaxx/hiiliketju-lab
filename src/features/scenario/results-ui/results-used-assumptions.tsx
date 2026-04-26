"use client";

import { usedAssumptionsToPrintable } from "@/core/reporting/build-used-assumptions-model";
import type { UsedAssumptionGroupId } from "@/core/reporting/build-used-assumptions-model";
import type { CalculationResult } from "@/core/domain/result";

import type { Locale } from "@/i18n/messages";

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
    <section
      data-testid="results-used-assumptions"
      className="space-y-8"
      aria-labelledby="results-used-assumptions-heading"
    >
      <div>
        <h3 id="results-used-assumptions-heading" className="text-base font-semibold tracking-tight text-foreground">
          {t("results.section.usedAssumptions")}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("results.usedAssumptions.lead")}
        </p>
      </div>

      {GROUP_ORDER.map((gid) => {
        const rows = byGroup.get(gid) ?? [];
        if (rows.length === 0) return null;
        return (
          <div key={gid} className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              {t(`results.usedAssumptions.group.${gid}`)}
            </h4>
            <div className="overflow-x-auto rounded-lg border border-border/60 shadow-[var(--shadow-tile)]">
              <table className="w-full min-w-[32rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/40 text-left text-xs text-muted-foreground">
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
    </section>
  );
}
