# Hiiliketju documentation index

Start with the root **[`README.md`](../README.md)** for setup, architecture summary, and folder map.

## Specifications (canonical product & calculation)

| Document | Audience | Content |
|----------|----------|---------|
| [`solution-spec-v2.md`](solution-spec-v2.md) | Product / UX / scope | MVP scope, paths, modes, principles |
| [`calculation-implementation-spec-v2.md`](calculation-implementation-spec-v2.md) | Engineers | Units, formulas, result registry, harmonization, WP28 capacity / market CO₂ purchase formulas, exports note |

## Repository maintenance and handoff

| Document | Content |
|----------|---------|
| [`repository-invariants.md`](repository-invariants.md) | Export boundary, accepted product behaviour (WP22–WP28), app-shell UX, plant capacity / market CO₂ semantics, “do not regress” checklist, electricity pipeline, MVP limits — **behavioural reference** alongside the code |
| [`customer-handoff-mvp.md`](customer-handoff-mvp.md) | English handoff: current capabilities, caveats, assumptions to verify, export behaviour, architecture invariants |

## User-facing (Finnish)

| Document | Content |
|----------|---------|
| [`user-guide-fi.md`](user-guide-fi.md) | Yleistajuinen suomenkielinen kuvaus työkalusta |

## Note on milestone labels

Older materials may use **WP*** milestone labels. **Current behaviour** is defined by this repository’s code, **[`repository-invariants.md`](repository-invariants.md)**, and the specifications linked above.
