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
| [`repository-invariants.md`](repository-invariants.md) | Canonical result, export API contract, mapper rules, warnings, checklists, known non-goals (includes post–WP1–WP3 UX boundaries: terminology, optional display units, CSV ingest) |

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

Earlier milestone handoff files (WP8–WP10 style) were **consolidated** into [`repository-invariants.md`](repository-invariants.md) so one place describes current behaviour and regression guardrails. [`solution-spec-v2.md`](solution-spec-v2.md) §16 still lists the original **delivery sequence** as historical reference only. Accepted **WP1–WP3** (terminology, limited display-unit switching, CSV time-series import) are reflected in invariants and spec touch-ups as of the April 2026 documentation pass—without changing canonical wire or engine contracts.
