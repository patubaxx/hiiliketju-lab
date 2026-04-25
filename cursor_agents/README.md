# cursor_agents (optional / internal)

This folder holds **legacy Cursor task prompts** and ad-hoc audit notes used during early implementation splits. It is **not** required to build, run, or test the application.

**Canonical guidance for humans and agents**

- **[`AGENTS.md`](../AGENTS.md)** (repository root) — mandatory rules and MVP policy.
- **[`.cursor/rules.md`](../.cursor/rules.md)** — Cursor workspace policy (kept in `.cursor/` by convention).
- **[`docs/index.md`](../docs/index.md)** — documentation map.
- **[`README.md`](../README.md)** — project entry, architecture, commands.

**Contents here**

- `prompt.txt` — short handoff template for chat outcomes.
- `agent1.md`, `agent2.md`, `agent3.md` — historical “agent split” prompts (domain vs engine vs UI). Useful only if you intentionally recreate that workflow; otherwise prefer `AGENTS.md` + specs.
- `ui-audit.md` — one-off UI audit notes; not a spec.

Milestone content under `cursor_agents/` is **historical**; **current** product behaviour and policy are in **[`docs/repository-invariants.md`](../docs/repository-invariants.md)** and **[`AGENTS.md`](../AGENTS.md)** (including **WP22–WP27**).

**Deliverable note:** If the customer package must exclude internal automation artifacts, omit or strip this folder; runtime behaviour is unchanged.
