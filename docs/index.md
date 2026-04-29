# Hiiliketju documentation index

Start with the root **[`README.md`](../README.md)** for setup, architecture summary, and folder map.

## Specifications (canonical product & calculation)

| Document | Audience | Content |
|----------|----------|---------|
| [`solution-spec-v2.md`](solution-spec-v2.md) | Product / UX / scope | MVP scope, paths, modes, principles |
| [`calculation-implementation-spec-v2.md`](calculation-implementation-spec-v2.md) | Engineers | Units, formulas, result registry, harmonization, WP28 capacity / market CO₂ purchase formulas, exports note |

## Repository maintenance

| Document | Content |
|----------|---------|
| [`repository-invariants.md`](repository-invariants.md) | **Maintainer first-line reference:** export boundary, WP22–WP28 accepted product behaviour, **current app-shell UX**, plant capacity / market CO₂ semantics, “do not regress” checklist, electricity pipeline, MVP limits — **source of truth for accepted UI behaviour** alongside the code |
| [`release-memo-mvp.md`](release-memo-mvp.md) | English handoff memo: current capabilities, caveats, and architecture invariants (updated with WP22–WP28 customer-delivery and alignment tranches) |

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

Earlier milestone handoff files (WP8–WP10 style) were **consolidated** into [`repository-invariants.md`](repository-invariants.md) so one place describes current behaviour and regression guardrails. [`solution-spec-v2.md`](solution-spec-v2.md) §16 lists the **original WP1–WP10 implementation sequence**; a **later customer-feedback sequence (WP22–WP27)** and **WP28 alignment** are documented there as separate historical lists. The **source of truth for accepted behaviour** is the repository code plus [`repository-invariants.md`](repository-invariants.md) (April 2026: default Finnish, Simple-first, seasonal default CO₂ profile, active assumption visibility, verdict + used assumptions, export readouts, presentation formatting, hero partner assets, optional plant capacity and market CO₂ purchase semantics).
