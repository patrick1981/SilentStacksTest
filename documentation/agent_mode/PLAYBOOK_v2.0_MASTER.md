# SilentStacks – Master Playbook (v1.2 → v2.0)

**Repo URL:** https://github.com/patrick1981/SilentStacksTest
**Primary branch:** main
**Working branch (agent):** feature/v2.0-monolith

> **LIVING DOCUMENT** — Agent must treat this file as living and update docs each run.

## Baseline Declaration (Read First)
This repo is a direct replication of SilentStacks **v1.2** and is the immutable baseline.
- Treat current `index.html` and `assets/css/style.css` as **read-only UI contract**.
- Do **not** change DOM structure, IDs, classes, ARIA roles, tab markup, or the 3-step indicator.
- Any DOM/CSS change requires rationale, DOM/CSS diff, before/after screenshots, and explicit approval.
- **Fail the run** if DOM/CSS diffs alter IDs/classes/roles or tab/stepper structure.

**Baseline verification (must run once at start):**
1) Snapshot DOM of the live v1.2 UI (header, tabs, stepper, main panels).  
2) Compare current repo `index.html` against v1.2 reference; assert **0** structural diffs.  
3) Confirm CSS selectors for tablist, panels, inputs, buttons are unchanged.  
4) Save results to `RELEASE_NOTES.md` under “Baseline Verification”.

> **LIVING DOCUMENT**
> Agent Mode must treat this file as living. On every run:
> 1) Read it in full; 2) Append “What changed in this build” to each doc;
> 3) Update CHANGELOG/RELEASE_NOTES; 4) If rules/features evolve, update this playbook and summarize the change.

Source of truth for UI: https://patrick1981.github.io/SilentStacks/  
Reference bundle (optional): `SilentStacks_v1.2_UI_Reference.zip`

---

## 0) UI Contract (Non-Negotiable)

- **Do not add frameworks** (no Bootstrap/Tailwind/CDNs).
- **Do not change** existing IDs, classes, ARIA roles, tab markup, or the 3-step indicator.
- All new behavior via **JS only** (adapters/api/exporters). **No HTML restructuring.**
- If a referenced file is missing (e.g., `documentation.js`), create a **no-op stub**.
- **Default theme = Light**; Dark/High-Contrast only when explicitly toggled.
- **Fail the run** if DOM/CSS diffs alter IDs/classes/roles or tab/stepper structure.

---

## 1) Deliverables

- **One file:** `dist/SilentStacks_v2_monolith.html` (all CSS/JS **inlined**; **no external/CDN** refs).
- **Release ZIP:** `SilentStacks_Release.zip` containing:
  - the monolith
  - `RELEASE_NOTES.md` (with screenshots)
  - `GAP_REPORT.md` (see template below)
  - updated docs (`documentation/QuickStart.md`, `TechMaintenance.md`, `DevelopersGuide.md`)

---

## 2) Phased Roadmap (v1.2 → v2.0)

### Phase A — Hardening & Parity
1. Add **Service Worker** + cache manifest (offline after first visit).
2. Add error boundary + `aria-live` notifications.
3. Implement **exporters** behind existing buttons: JSON, CSV, **NLM**.
4. Tests: **no uncaught errors** on boot; keyboard traversal across tabs.

### Phase B — Enrichment & Cross-Population
1. API clients with rate limits (see §4).
2. **Bulk Paste / Bulk Upload** for mixed IDs (PMID/DOI/NCT).
3. **Cross-populate** identifiers; merge sources; record conflicts in `sourceConflicts`.
4. **MeSH auto-tagging** (≤5) rendered in existing tag UI.

### Phase C — Accessibility (WCAG 2.2 AAA)
1. Theme toggle (Light/Dark/HC) in **Settings**; persist choice.
2. Labels, names/roles/values; **7:1** contrast; skip links; visible focus.
3. Keyboard-only passes on: Add→Enrich→Save; Bulk Import→Export.

### Phase D — Offline-First
1. **Queue** lookups/exports while offline; retry on reconnect.
2. Verify offline boot; add cache integrity check (Diagnostics).

### Phase E — Search/Filter Upgrades
1. Keep **Fuse.js**; add **fielded** search + ranking (no UI changes).
2. Preserve table; add sort & filter bound to current headers/inputs.

---

## 3) Feature Checklist (v2.0 scope)

- Offline-first with SW + queue  
- Bulk import/export (paste/CSV/JSON) with dedupe/normalize  
- Cross-population between PMID, DOI, NCT  
- Enrichment: PubMed, CrossRef, ClinicalTrials.gov  
- MeSH auto-tags (≤5)  
- Advanced search/filter (fuzzy + fielded); sortable table  
- Status / Priority / Tags with color chips  
- NLM citation export  
- WCAG 2.2 AAA with Light/Dark/HC (**Light default**)  
- Security: sanitize inputs, escape renders (XSS-safe)  
- **No DOM/CSS drift** from v1.2

> **Future hooks only (leave UI unchanged in 2.0):**
> predictive synonyms; MeSH hierarchy (+★ for major topic); specialty detection; urgency heat map; simple trends; dynamic/custom fields import/export.

---

## 4) Data, API & Security

**Record model (keys used by table/cards/exports):**
```js
{
  id: "uuid",
  createdAt: "ISO",
  priority: "Low|Normal|High|Urgent",  // maps to "Urgency"
  docline: "string",                   // "Docline Number"
  identifiers: { pmid:"", doi:"", nct:"" },
  title:"", authors:"", journal:"", year:"", volume:"", issue:"", pages:"",
  citation:"",                         // NLM string for quick display/exports
  patronName:"", status:"New|In Progress|On Hold|Fulfilled|Canceled",
  mesh:[], tags:[], notes:"",
  sources:{ pubmed:{}, crossref:{}, clinicaltrials:{} },
  sourceConflicts:{}
}
```

**Rate limits:** PubMed ≤ **2/sec**, CrossRef ≤ **5/sec**, ClinicalTrials.gov **1/sec**  
**Retries:** exponential backoff; **30s** timeouts; visible error messages  
**Security:** sanitize all inputs; **disallow HTML** in text fields; **escape** output when rendering

---

## 5) Table & Data Rules (v2.0 hard requirements)

**Column order (exact):**
`Urgency | Docline Number | PMID | Citation | Patron Name | Status`

**Headings (exact strings):**
`Urgency`, `Docline Number`, `PMID`, `Citation`, `Patron Name`, `Status`

**Bulk Paste/Upload (PMID-only path):**
* Accept PMIDs only (commas / spaces / newlines)
* Enrich each via **PubMed**; if NCT is present/linked, also fetch **ClinicalTrials.gov**
* **Ignore empty tokens/rows** (no blank records)

**Empty/Blank fields:**
* **Import:** ignore blanks; never overwrite existing values with blanks
* **Export:** include columns; blanks output as **empty strings** (`""`) — never `null`/`undefined`

**Validation:**
* PMID is 6–9 digits
* Urgency ∈ {Low, Normal, High, Urgent} (default Normal)
* Status ∈ {New, In Progress, On Hold, Fulfilled, Canceled} (default New)

---

## 6) Record Cards & MeSH Chips (no DOM restructuring)

See full details in the working draft — includes color-coded status icons, MeSH selection filters, and trial snippets.

---

## 7) Tests (must pass)
* Boot, Lookup (PMID/DOI/NCT), Bulk, Enrichment/Merge, Search, Export, Offline, A11Y
* **Screenshots:** Dashboard, Add New Request, All Requests, Import/Export, Settings (attach to `RELEASE_NOTES.md`)

---

## 8) Documentation & Code Quality (must-do each run)
* Update `documentation/QuickStart.md`, `documentation/TechMaintenance.md`, `documentation/DevelopersGuide.md`
* Append dated **“What changed in this build”** to each
* Update `RELEASE_NOTES.md` and `CHANGELOG.md`
* JSDoc for all exported/public functions
* Rationale comments for non-obvious logic
* **Fail the run** if docs are missing/outdated or exported functions lack JSDoc

---

## 9) Agent Start Prompt (copy into Agent Mode)
> You are the lead developer for SilentStacks v2.0.
> Follow `documentation/Agent_Package/PLAYBOOK_v2.0_MASTER.md` **exactly**.
> Preserve the v1.2 UI (no DOM/CSS changes).
> Build a single-file `dist/SilentStacks_v2_monolith.html` (no CDNs).
> Implement all v2.0 features, run tests, generate screenshots/docs, and package `SilentStacks_Release.zip`.
> **Pause for approval** before any DOM/CSS edits; provide diffs + screenshots.
