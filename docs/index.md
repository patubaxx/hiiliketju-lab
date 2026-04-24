# Hiiliketju documentation index

Start with the root **[`README.md`](../README.md)** for setup, architecture summary, and folder map.

## Specifications (canonical product & calculation)

| Document | Audience | Content |
|----------|----------|---------|
| [`solution-spec-v2.md`](solution-spec-v2.md) | Product / UX / scope | MVP scope, paths, modes, principles |
| [`calculation-implementation-spec-v2.md`](calculation-implementation-spec-v2.md) | Engineers | Units, formulas, result registry, harmonization, exports note |

## Repository maintenance

| Document | Content |
|----------|---------|
| [`repository-invariants.md`](repository-invariants.md) | Canonical result, export API contract, mapper rules, warnings, checklists, known non-goals (includes current visible-vs-internal UX boundaries: annual CO₂ fixed to `kt/year`, constant electricity display-unit switching only, CSV ingest, retained hidden wire modes) |
| [`release-memo-mvp.md`](release-memo-mvp.md) | MVP release/handoff memo: what the tool now does, user-visible capabilities, important caveats, assumptions to verify, and next-phase roadmap |

## Implementation policy (automation-friendly)

| Location | Role |
|----------|------|
| [`AGENTS.md`](../AGENTS.md) (repo root) | Non-negotiable rules; assumption flags; testing expectations |
| [`.cursor/rules.md`](../.cursor/rules.md) | Cursor workspace mirror of core policy |

## Internal / optional

| Location | Role |
|----------|------|
| [`cursor_agents/README.md`](../cursor_agents/README.md) | What `cursor_agents/` is (legacy prompts; not part of runtime) |

## Historical note

Earlier milestone handoff files (WP8–WP10 style) were **consolidated** into [`repository-invariants.md`](repository-invariants.md) so one place describes current behaviour and regression guardrails. [`solution-spec-v2.md`](solution-spec-v2.md) §16 still lists the original **delivery sequence** as historical reference only. Accepted UX refinements are reflected in invariants and spec touch-ups as of the April 2026 documentation pass: annual CO₂ is visibly fixed to `kt/year`, constant electricity retains the only visible display-unit switch, CSV time-series import feeds the existing bulk path, and hidden wire capabilities stay intact.
