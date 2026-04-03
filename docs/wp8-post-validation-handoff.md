# Post-validation handoff — WP8 Polish + QA

**Status date:** After WP8 polish/QA pass.  
**Audience:** Maintainers and the next feature phase.  
**Source of truth:** Canonical calculation and export architecture validated through WP9 (see `docs/wp9-post-check-validation.md`), plus `AGENTS.md` and `.cursor/rules.md`. For a release snapshot after doc alignment, see `docs/wp10-release-readiness-handoff.md`.

---

## Executive verdict

**WP8 is a maintenance pass, not a new product slice.** The canonical-result architecture, opaque warnings, honest assumptions handling, and single-scenario flow are unchanged. Changes are limited to UX polish, heading semantics, export affordances, i18n consistency, small reporting-helper DRY, and targeted tests.

---

## What stayed the same (do not regress)

- `calculateScenario` → `CalculationResult` remains the only numerical source for UI, Excel, and PDF.
- `warnings` stay raw `string[]` with no parsing, classification, or locale heuristics.
- Assumptions in UI focus on `result.input.process` with real metadata; exports serialize `ScenarioInput` as-is where metadata exists.
- Excel/PDF builders map and format only; they do not re-derive KPIs or harmonized series.

---

## What WP8 adjusted

- **Accessibility:** Results subsections use `h3`/`h4` under the form `Section` `h2` (“Calculation output”) to fix heading order. Export buttons expose `aria-busy`, `aria-label`, and export errors use `aria-live="polite"`.
- **Consistency:** Annual summary table now shows methane price metrics with the same `… / t` suffix as the KPI cards.
- **Empty states:** Clearer `results.empty` copy (en/fi/sv); daily preview shows `results.table.dailyPreviewEmpty` when there are zero daily rows.
- **DRY:** Shared `safeExportBasename` for Excel/PDF download filenames.
- **Tests:** `safe-export-basename.test.ts`; Excel export model test that process assumption metadata matches `result.input.process`.

---

## Honest gaps (future work, not WP8)

- Full locale-aware unit labels on KPIs (still mixed translated labels + fixed unit abbreviations).
- Richer assumption surfacing for economics/temporal modes in the results UI (still primarily process assumptions).
- Structured warnings contract if product needs severity or translation keys from the engine.
- Multi-scenario comparison and persistence.

---

## Cross-reference

- Export hardening: `docs/wp9-export-hardening-handoff.md`, `docs/wp9-post-check-validation.md`
- Solution intent: `docs/solution-spec-v2.md`
- Calculation contract: `docs/calculation-implementation-spec-v2.md`
