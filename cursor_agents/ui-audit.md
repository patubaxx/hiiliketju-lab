
Here is the audit based on the implemented UI in this repo (single home page, `ScenarioInputApp`, shadcn/Tailwind tokens, results under `results-ui/`).

---

# 1. Executive assessment

The UI is **coherent, functional, and already restrained** (neutral grayscale palette, light borders, small shadows, no gradients or glass). It reads as a **competent shadcn-style internal tool** more than a **calm Nordic B2B consultancy deliverable**.  

**Gap to target:** typography and hierarchy are **flat**, the **form is one long vertical stack** with **run/reset below everything**, and the **results area repeats the same information** (KPI grid vs annual table vs path comparison) without a clear “executive vs detail” story. **Amber** and **emerald** accents are appropriate for assumptions/success but are applied in a way that still feels **component-default** rather than **editorial**.  

Overall: **solid MVP baseline (~60–70% toward the stated direction)**; the biggest wins are **layout shell, typographic scale, and results information design**—all achievable without touching the calculation layer.

---

# 2. What already works

- **Neutral OKLCH theme** in `globals.css`: professional, not flashy; chart tokens align with muted UI.
- **Consistent primitives**: `Section`, `FieldLabel`, `FieldHint`, `FieldError`, shared `inputClassName` / `selectClassName` / `textAreaClassName` in `form-primitives.tsx` keep inputs predictable.
- **Clear separation of concerns**: `ScenarioInputApp` orchestrates payload build + `calculateScenario`; `ResultsPanel` only renders `CalculationResult`—architecture matches your rules.
- **Assumption visibility**: `ResultsAssumptions` distinguishes `literature_based` with border/background and a badge; advanced inputs mirror metadata—good for trust and auditability.
- **Charts**: Recharts usage is restrained (`isAnimationActive={false}`, CSS variables for strokes, simple tooltips)—fits “technical, not marketing.”
- **Exports**: Busy state, `aria-busy`, `aria-live` for errors in Excel/PDF buttons—thoughtful baseline accessibility for async actions.
- **i18n**: Locale persists; `document.documentElement.lang` updates—professional detail.

---

# 3. Main UI problems

1. **Flat hierarchy**: Page title (`text-2xl`), section titles (`text-base` in `Section`), and many result subheads (`text-sm`) are **close in weight/size**; little sense of “document title → chapter → detail.”
2. **Single long column**: Everything scrolls as one list; **primary actions and outcomes are buried** (run after advanced section; results last inside another card).
3. **Results feel like “more form”**: Results live inside the same `Section` card pattern as inputs, so outputs do not yet read as a **distinct decision-support surface**.
4. **KPI density**: `ResultsKpiGrid` exposes **many equal-weight cards** in a large grid—tends toward **dashboard clutter** rather than a **tiered summary** (headline metrics vs supporting metrics).
5. **Redundant presentation**: Annual KPIs appear in **KPI grid**, **path comparison strip**, and **annual summary table**—same numbers, three treatments; increases scan cost without adding meaning.
6. **Developer-oriented error display**: Validation aggregates show **`font-mono` schema paths** (`co2.availability...`) to end users—accurate for engineering, **harsh for business stakeholders**.
7. **Advanced / assumptions tone**: Raw `key` strings in monospace under each process field (`scenario-input-app.tsx`) and repeated amber callouts are **honest but rough** for a premium consultancy feel.
8. **Typographic character**: **Geist** (layout) is a strong “modern product default”; it does not strongly signal **Nordic / institutional** the way a more editorial sans or humanist choice could (optional later).
9. **Visual sameness**: Repeated `rounded-xl border ... shadow-sm` on sections, KPIs, charts, and warnings **works** but can feel **template-heavy** without variation in **spacing rhythm** or **surface levels** (e.g. one clear “paper” results panel).
10. **Chart readability**: Light-mode `--chart-1` is very light gray (`oklch(0.87 0 0)`); the methane series may be **low-contrast** on white—worth verifying visually.

---

# 4. Recommended design direction for this codebase

Interpret **“calm Nordic technical consultancy”** as:

| Area | Direction |
|------|-----------|
| **Typography** | Clear **3-level scale**: strong page title, distinct section titles, relaxed body. Reserve **uppercase + tracking** for **table headers and micro-labels only**, not every KPI/chart title. Keep **tabular nums** and **mono for numbers** where precision matters; avoid **mono for long warning sentences** if readability suffers. |
| **Spacing density** | **More air** between major blocks; slightly **tighter** within related field groups. Aim for **one obvious vertical rhythm** (e.g. 8px base) applied consistently in `Section` internals vs between sections. |
| **Card / surface** | **Inputs**: light card on `bg-muted/30` page (current idea is fine). **Results**: consider **one dominant surface** (e.g. slightly different background or stronger top border) so the output reads as **the deliverable**, not another form card. |
| **Chart framing** | Keep thin grids and muted axes; **ensure minimum contrast** for primary series. Titles as **sentence case** or small caps used sparingly—not full uppercase everywhere. |
| **Tables** | Slightly **more padding** on cells; optional **zebra or row hover** for long monthly/daily previews; keep **right-align numeric columns** for scanability. |
| **Buttons** | Favor **outline/secondary for secondary actions**, single **solid primary** for run; reduce **perceived play** (e.g. evaluate whether `active:translate-y-px` on buttons matches “restrained”). |
| **Page structure** | **Above the fold**: title + short positioning line + locale. Then either **two-column** (inputs \| sticky summary/actions) on large screens, or **sticky footer bar** with run/reset—so the **task** stays visible. **Results**: anchor with a clear **“Scenario outcome”** header and short interpretive lead before KPIs. |
| **Emphasis** | **Quiet success** (muted green border or single line) instead of a prominent emerald paragraph if you want less “alert” and more “status.” Keep **amber** for literature/pending, but **one** callout pattern reused everywhere. |

All of this stays **presentation-only** relative to your architecture.

---

# 5. Prioritized improvement list

### P1 — should do first (high impact, mostly low risk)

- Establish a **typographic scale** (page `h1`, section `h2`, subsection `h3`) and **reduce uppercase label noise** in KPI/chart/table subheads where it hurts readability.
- **Tier the KPI area**: e.g. 3–4 **headline** metrics (cost, revenue, delta vs H₂ sale, break-even or margin proxy) + **collapsible or secondary grid** for the rest—without changing what is computed.
- **Differentiate the results block** visually from input sections (background, top rule, or full-width inner padding) so it reads as **output**.
- **Soften validation UX**: keep paths for debugging if needed, but **lead with human messages**; consider grouping by section rather than a flat path list.
- **Audit chart colors** for contrast (especially `--chart-1` methane line).

### P2 — should do next (structural polish, moderate effort)

- **Layout shell**: large screens—**two columns** or **sticky run bar**; avoid scrolling past advanced assumptions to act.
- **Reduce redundancy**: pick **one canonical “annual summary” presentation** (grid *or* table *or* compact definition list) and demote duplicates to “details” or remove from default view.
- **Table polish**: numeric alignment, column min-widths, optional row hover; tighten **monthly/daily** preview framing.
- **Advanced assumptions UX**: hide raw `key` behind a “technical id” toggle or dev-only affordance; unify amber callout copy/layout with results assumptions.

### P3 — optional later

- **Font change** to a more editorial / institutional sans (if brand allows).
- **Micro-interactions**: focus rings only (already good); refine button active states.
- **Empty states**: richer but still quiet illustration or short “what to do next” for first visit.
- **Dark mode** fine-tuning (e.g. sidebar primary purple in `.dark` is off-brand if you ever expose sidebar).

### Not recommended right now

- Rebuilding charts in another library, **adding new KPIs**, or **merging path comparison logic into new client-side math**.
- Heavy **marketing-style** hero sections or **new navigational IA** (still single-scenario MVP).

---

# 6. Safe implementation boundary

| Category | Scope |
|----------|--------|
| **Presentation-only** | `globals.css` (tokens, chart colors), `layout.tsx` (fonts, body classes), `form-primitives.tsx` (Section/labels/inputs), all of `results-ui/*`, `components/ui/button.tsx` (variants/classes only), classNames in `scenario-input-app.tsx` without changing state or handlers. |
| **Likely component refactoring** | Splitting `scenario-input-app.tsx` into smaller presentational sections; extracting **KpiCard** variants or **ResultsLayout** wrapper; optional **collapsible** regions (UI state only). |
| **Must stay untouched for integrity** | `calculateScenario`, domain types, `buildScenarioPayload`, Zod schemas, export API contracts, **`warnings` as `string[]`**, assumption metadata shape and semantics, **no formulas in React** beyond formatting. |

---

# 7. Proposed implementation slices

1. **Slice 1 — Tokens, type scale, page shell**  
   `globals.css`, `layout.tsx`, `form-primitives.tsx` (`Section` header sizes/spacing), root container in `scenario-input-app.tsx` (max-width, vertical rhythm).

2. **Slice 2 — Form polish**  
   Field grouping spacing, advanced section (callout + key display), validation banner content structure—still same `errors` map.

3. **Slice 3 — Results polish**  
   `results-panel.tsx` (header, success treatment, path comparison hierarchy), `results-kpi-grid.tsx` (tiered layout), dedupe vs `results-tables.tsx`.

4. **Slice 4 — Charts, tables, warnings**  
   `results-charts.tsx` (contrast, titles), `results-tables.tsx` (alignment, density), `results-warnings.tsx` (typography for long strings).

5. **Slice 5 — Layout affordances**  
   Sticky actions or responsive two-column—only after slices 1–3 stabilize the visual language.

---

# 8. File-level guidance (first touches)

| File | Why first |
|------|-----------|
| [`src/app/globals.css`](src/app/globals.css) | Theme tokens, chart colors, global type rhythm. |
| [`src/app/layout.tsx`](src/app/layout.tsx) | Font choice / variables, body background consistency with shell. |
| [`src/features/scenario/input-ui/form-primitives.tsx`](src/features/scenario/input-ui/form-primitives.tsx) | `Section`, labels, hints—sets tone for entire form. |
| [`src/features/scenario/input-ui/scenario-input-app.tsx`](src/features/scenario/input-ui/scenario-input-app.tsx) | Page structure, validation banner, action placement, advanced blocks. |
| [`src/features/scenario/results-ui/results-panel.tsx`](src/features/scenario/results-ui/results-panel.tsx) | Results entry point and ordering of warnings vs assumptions (if you ever reorder, keep **warnings visible**—only move for hierarchy, not to hide). |
| [`src/features/scenario/results-ui/results-kpi-grid.tsx`](src/features/scenario/results-ui/results-kpi-grid.tsx) | Highest visual density; biggest perception win. |
| [`src/features/scenario/results-ui/results-tables.tsx`](src/features/scenario/results-ui/results-tables.tsx) | Redundancy and table readability. |
| [`src/features/scenario/results-ui/results-charts.tsx`](src/features/scenario/results-ui/results-charts.tsx) | Contrast and title treatment. |
| [`src/components/ui/button.tsx`](src/components/ui/button.tsx) | Primary vs secondary emphasis, interaction feel. |

---

## Recommended next action

Use **multiple narrow implementation passes** (the slices above), not one giant PR.  

**Why:** typography and tokens affect **every** screen; results hierarchy touches **several** components; layout/sticky actions can conflict with spacing decisions if done in one lump. Sequencing **tokens + results headline treatment + KPI tiering** first yields a **large perceived upgrade** with **low regression risk** to the calculation pipeline; structural layout can follow once the visual system is stable.

---

### Extra: priority bands from your brief

- **High impact, low risk:** token/typography scale, results surface differentiation, KPI tiering, validation copy/presentation, chart contrast fixes.  
- **Medium effort structural polish:** two-column or sticky actions, deduplicating annual summary presentations, table alignment/density, hiding raw assumption keys.  
- **Not recommended right now:** new product features, new charts/metrics, client-authoritative exports, moving or re-deriving numbers in the UI.