# SilentStacks – Master Playbook (v1.2 → v2.0)

**Repo URL:** https://github.com/patrick1981/SilentStacksTest  
**Primary branch:** main  
**Working branch (agent):** feature/v2.0-monolith

> **LIVING DOCUMENT** — Agent must treat this file as living.  
> On every run:
> 1. Read this playbook in full.  
> 2. Update `CHANGELOG.md` and `RELEASE_NOTES.md`.  
> 3. Append a dated “What changed in this build” to:
>    - `documentation/QuickStart.md`
>    - `documentation/TechMaintenance.md`
>    - `documentation/DevelopersGuide.md`  
> 4. If rules/features evolve, update this playbook and summarize the change in `RELEASE_NOTES.md`.

---

## Baseline Declaration (Read First)

- This repo is a **direct replication of SilentStacks v1.2** — the **immutable baseline** for v2.0.
- Treat current `index.html` and `assets/css/style.css` as **read-only UI contract**.
- **Do not** change DOM structure, IDs, classes, ARIA roles, tab markup, or the 3-step indicator.
- Any DOM/CSS change requires written rationale, diff, before/after screenshots, and approval.
- **Fail the run** if DOM/CSS diffs alter IDs/classes/roles or tab/stepper structure.

**Baseline Verification** (run once and attach to `RELEASE_NOTES.md`):
1. Snapshot DOM of live v1.2 UI (header, tabs, stepper, main panels).  
2. Compare current repo `index.html` to v1.2 reference; assert **0** structural diffs.  
3. Confirm CSS selectors for tablist, panels, inputs, buttons are unchanged.  
4. Save results under “Baseline Verification” in `RELEASE_NOTES.md`.

**UI source of truth:** https://patrick1981.github.io/SilentStacks/

---

## UI Contract (Non-Negotiable)

- **No frameworks** (no Bootstrap/Tailwind/CDNs).  
- **No HTML restructuring** — all behavior via new JS modules.  
- Missing files → create no-op stubs.  
- **Default theme = Light**; Dark/HC only when toggled.  
- **Run fails** on UI contract violations.

---

## Deliverables

- **Monolith:** `dist/SilentStacks_v2_monolith.html` (all CSS/JS inlined, no external/CDN refs).
- **Release ZIP:** `SilentStacks_Release.zip` containing:  
  - the monolith  
  - `RELEASE_NOTES.md` (with required screenshots)  
  - `GAP_REPORT.md`  
  - updated docs (`documentation/QuickStart.md`, `TechMaintenance.md`, `DevelopersGuide.md`)

**Required screenshots:** Dashboard, Add New Request, All Requests, Import/Export, Settings

---

## Phased Roadmap (v1.2 → v2.0)

**Phase A — Hardening & Parity**
1. Service Worker + cache manifest.  
2. Error boundary + `aria-live` notifications.  
3. JSON/CSV/NLM exporters behind existing buttons.  
4. Tests: zero uncaught errors; keyboard traversal.

**Phase B — Enrichment & Cross-Population**
1. API clients with rate limits.  
2. Bulk paste/upload for mixed IDs (PMID/DOI/NCT).  
3. Cross-populate identifiers; merge sources; track `sourceConflicts`.  
4. **MeSH auto-tagging** (≤5) rendered in tag UI.

**Phase C — Accessibility (WCAG 2.2 AAA)**
1. Theme toggle (Light/Dark/HC); persist choice.  
2. Labels, roles, values; **7:1** contrast; skip links; visible focus.  
3. Keyboard-only passes (Add→Enrich→Save; Bulk→Export).

**Phase D — Offline-First**
1. Queue lookups/exports offline; retry on reconnect.  
2. Offline boot; cache integrity check.

**Phase E — Search/Filter Upgrades**
1. Keep Fuse.js; add fielded search + ranking.  
2. Table sort/filter bound to headers/inputs.

---

## Feature Checklist (v2.0 scope)

- Offline-first (SW + queue)  
- Bulk import/export (paste/CSV/JSON) with dedupe/normalize  
- Cross-population: PMID ↔ DOI ↔ NCT  
- Enrichment: PubMed, CrossRef, ClinicalTrials.gov  
- **PMID enrichment with Major/Minor MeSH + User Tags** (see correction below)  
- Advanced search/filter (fuzzy + fielded) in table + cards  
- Status / Priority / Tags with color chips (medical UX colors)  
- NLM citation export  
- WCAG 2.2 AAA (Light default; Dark/HC opt-in)  
- Security: sanitize inputs, escape renders  
- No DOM/CSS drift

---

## Data, API & Security

**Record model:**
```js
{
  id: "uuid",
  createdAt: "ISO",
  priority: "Low|Normal|High|Urgent",
  docline: "string",
  identifiers: { pmid:"", doi:"", nct:"" },
  title:"", authors:"", journal:"", year:"", volume:"", issue:"", pages:"",
  citation:"",
  patronName:"", status:"New|In Progress|On Hold|Fulfilled|Canceled",
  mesh:[], tags:[], notes:"",
  sources:{ pubmed:{}, crossref:{}, clinicaltrials:{} },
  sourceConflicts:{}
}
```
**Rate limits:** PubMed ≤ 2/sec; CrossRef ≤ 5/sec; ClinicalTrials.gov 1/sec  
**Security:** sanitize inputs; escape output; disallow HTML.

---

## Table & Data Rules

**Column order (exact):**
```
Urgency | DOCLINE Number | Citation | Patron E-mail | Status | Date Stamp
```
- DOCLINE unique across dataset.

**PMID-only Bulk Path:**
- Accept PMIDs only; enrich via PubMed; if NCT present, enrich via ClinicalTrials.gov.  
- Ignore blanks; never overwrite with blanks.

---

## Correction – Item A: PMID Enrichment with Major/Minor MeSH + Tags + NLM Formatting

**Behavior**
- User enters valid PMID → Lookup → PubMed populates core metadata + major & minor MeSH headings (chips).  
- MeSH chips selectable; major topics: dark teal border/light teal background or bold; minor topics: light gray border/white background.  
- User can add free-text tags (neutral gray border, light yellow background).  
- NCT auto-fill & CT.gov enrichment with abstract + color-coded status chip.  
- PMIDs required for enrichment.

**Color coding (UX best practice)**
- Urgent = #B71C1C; High = #E65100; Normal = #1565C0; Low = #2E7D32  
- Trial status chips: per mapping (Recruiting green, etc.).

**On Save**
- Citation stored in NLM format.  
- Selected MeSH & tags saved in arrays.  
- All form data preserved.

---

## Bulk Import Modes (Rich vs Minimal)

### Mode 1 — Rich CSV/JSON (optional headings)
- Accepts any subset of fields; maps known headings, preserves extras.
- Enrichment if PMID present; fallback to DOI/NCT if PMID missing.
- Merge rules: never overwrite non-blank with blank.

### Mode 2 — Minimal PMIDs (no headings required)
- Accept plain list of PMIDs; PMIDs validated and enriched.
- Creates fully enriched records ready for bulk updates.

## Post-Import Workflow
- Users filter newly imported records, bulk update urgency/status/tags, then fill missing fields individually.
- Docline uniqueness enforced.
- Filters/sorts consistent across table and card views.

---

## Bugs / Shortcomings (must be resolved next run)
1. No NCT content on “Add Request” form → should auto-fill & enrich when PMID has NCT.
2. Imported content not enriched with NCT data.
3. Table View button not populating table.
4. No MeSH headings as taggable options.
