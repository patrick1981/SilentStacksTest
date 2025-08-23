# SilentStacks – Master Playbook (v1.2 → v2.0)
**Updated:** 2025-08-11

**Repo URL:** https://github.com/patrick1981/SilentStacksTest  
**Primary branch:** main  
**Working branch (agent):** main  
**Working mode:** PR-only against `main`. Do not push directly to `main`.
**Review model:** Solo maintainer **may self-merge** PRs after running the pre-flight checklist and attaching test results/screenshots.

> **LIVING DOCUMENT** — Agent must treat this file as living and update docs each run.

## Baseline Declaration (Read First)

**Agent must also follow** `AGENT_POLICY.md` (operational safety rules).

This repo is a direct replication of SilentStacks **v1.2** and is the immutable baseline.
- Treat current `index.html` and `assets/css/style.css` as **read-only UI contract**.
- Do **not** change DOM structure, IDs, classes, ARIA roles, tab markup, or the 3-step indicator.
- Any DOM/CSS change requires rationale, DOM/CSS diff, before/after screenshots, and explicit approval.
- **Fail the run** if DOM/CSS diffs alter IDs/classes/roles or tab/stepper structure.

**Baseline Preservation — CRUD Operations**  
All record management functions present in v1.2 — including single-record edit, bulk update, and bulk delete — **must remain fully functional** in v2.0.  
- UI/UX for these actions must remain identical to v1.2 (no relocation, no renaming of buttons).  
- Implementation may be refactored, but behavior and keyboard accessibility must match.  
- Any loss of this functionality is considered a **baseline regression** and must fail the build.

**Baseline verification (must run once at start):**
1) Snapshot DOM of the live v1.2 UI (header, tabs, stepper, main panels).  
2) Compare current repo `index.html` against v1.2 reference; assert **0** structural diffs.  
3) Confirm CSS selectors for tablist, panels, inputs, buttons are unchanged.  
4) Save results to `RELEASE_NOTES.md` under “Baseline Verification”.

Source of truth for UI: https://patrick1981.github.io/SilentStacks/  
Reference bundle (optional): `SilentStacks_v1.2_UI_Reference.zip`

---

## 0) UI Contract (Non-Negotiable)
- **No frameworks** (no Bootstrap/Tailwind/CDNs).
- **Do not change** existing IDs, classes, ARIA roles, tab markup, or the 3-step indicator.
- All new behavior via **JavaScript only** (adapters/api/exporters). **No HTML restructuring.**
- If a referenced file is missing (e.g., `documentation.js`), create a **no-op stub**.
- **Default theme = Light**; Dark/High-Contrast only when explicitly toggled.
- **Fail the run** if DOM/CSS diffs alter IDs/classes/roles or tab/stepper structure.

---

## 1) Deliverables
- **One file:** `dist/SilentStacks_v2_monolith.html` (all CSS/JS **inlined**; **no external/CDN** refs).
- **Release ZIP:** `SilentStacks_Release.zip` containing:
  - the monolith
  - `RELEASE_NOTES.md` (with screenshots)
  - `GAP_REPORT_v2.0.md`
  - updated docs (`documentation/QuickStart.md`, `TechMaintenance.md`, `DevelopersGuide.md`)

---

## 2) Phased Roadmap (v1.2 → v2.0)

### Phase A — Hardening & Parity
1. Add **Service Worker** + cache manifest (offline after first visit; guard against `file://`).
2. Add error boundary + `aria-live` notifications.
3. Implement **exporters** behind existing buttons: JSON, CSV, **NLM**.
4. Tests: **no uncaught errors** on boot; keyboard traversal across tabs.

### Phase B — Enrichment & Cross-Population
1. API clients with rate limits (see §4).
2. **Bulk Paste / Bulk Upload** for **mixed IDs (PMID/DOI/NCT)** with normalization & dedupe.
3. **Cross-populate** identifiers; merge sources; record conflicts in `sourceConflicts`.
4. **MeSH auto-tagging** (≤8) rendered as **selectable, color-coded chips** in existing tag UI and cards.

### Phase C — Accessibility (WCAG 2.2 AAA)
1. Theme toggle (Light/Dark/HC) in **Settings**; persist choice.
2. Labels, names/roles/values; **7:1** contrast; skip links; visible focus.
3. Keyboard-only passes on: Add→Enrich→Save; Bulk Import→Export.

### Phase D — Offline-First
1. **Queue** lookups/exports while offline; retry on reconnect.
2. Verify offline boot; add cache integrity check (Diagnostics).

### Phase E — Search/Filter Upgrades
1. Keep **Fuse.js** (or tiny subsequence scorer); add **fielded** search + ranking (no UI changes).
2. Preserve table; add sort & filter bound to current headers/inputs.

### Phase F — Extended Intelligence
- **Predictive synonyms** (query expansion for search).
- **MeSH hierarchy** awareness (+★ for major topic optional in v2.0).
- **Specialty detection** (derive from MeSH/journal/tags).
- **Urgency heat map** (recency-weighted priority density on Dashboard) with text alt.
- **Trends** (weekly/monthly counts, median TTF) with small sparkline.
- **Custom fields import/export** (round-trip unknown columns via `record.custom`).

### Phase G — ClinicalTrials.gov Tagging
- Tags for **Sponsor Type**, **Phase**, **Overall Status**.
- All CT tags **color-coded** and **selectable** to filter.

---

## 3) Feature Checklist (v2.0 scope)
- Offline-first with SW + queue  
- Bulk import/export (paste/CSV/JSON) with dedupe/normalize  
- Cross-population between PMID, DOI, NCT  
- Enrichment: PubMed, CrossRef, ClinicalTrials.gov  
- **MeSH auto-tags (≤8) as selectable, color-coded chips**  
- **CT.gov tags:** sponsorship, phase, status — color-coded & selectable  
- Predictive synonyms; MeSH hierarchy; specialty detection  
- Urgency heat map; trends  
- Advanced search/filter (fuzzy + fielded); sortable table  
- Status / Priority / Tags with color chips  
- NLM citation export  
- WCAG 2.2 AAA with Light/Dark/HC (**Light default**)  
- **Security:** sanitize inputs, escape outputs (XSS-safe), **API injection prevention**  
- **No DOM/CSS drift** from v1.2

---

## 4) Data, API & Security

**Record model (keys used by table/cards/exports):**
```js
{
  id: "uuid",
  createdAt: "ISO",
  updatedAt: "ISO",
  priority: "Low|Normal|High|Urgent",  // maps to table "Urgency"
  docline: "string",                   // "Docline Number"
  identifiers: { pmid:"", doi:"", nct:"" },
  title:"", authors:"", journal:"", year:"", volume:"", issue:"", pages:"",
  citation:"",                         // NLM string for quick display/exports
  patronName:"", patronEmail:"",
  status:"New|In Progress|On Hold|Fulfilled|Canceled",
  mesh:[],          // human MeSH labels
  meshTree:[],      // optional MeSH tree codes for hierarchy matching
  trial: {          // CT.gov summary
    sponsorType:"", // Industry | NIH | Other
    phase:"",       // e.g., Phase 2/3
    overallStatus:""// Recruiting | Completed | ...
  },
  specialty:"",     // inferred
  custom:{},        // round-tripped unknown import columns
  sources:{ pubmed:{}, crossref:{}, clinicaltrials:{} },
  sourceConflicts:{}
}
```

**Rate limits:** PubMed ≤ **2/sec**, CrossRef ≤ **5/sec**, ClinicalTrials.gov **1/sec**  
**Retries:** exponential backoff; **30s** timeouts; visible error messages  
**Security:**  
- **Input sanitization:** strip HTML/control chars; strict ID regex (PMID `^\d{{6,9}}$`, DOI `^10\.\d{{4,9}}/\S+$`, NCT `^NCT\d{{8}}$`).  
- **Output escaping:** escape all rendered text; never `innerHTML` with untrusted data.  
- **API injection prevention:** allow-list known params; always `encodeURIComponent` identifiers.  

---

## 5) Table & Data Rules (v2.0 hard requirements)

**Column order (exact):**
`Urgency | Docline Number | PMID | Citation | Patron Name | Status`

**Headings (exact strings):**
`Urgency`, `Docline Number`, `PMID`, `Citation`, `Patron Name`, `Status`

**Bulk Paste/Upload (mixed IDs path):**
* Accept **PMIDs, DOIs, NCTs** (commas / spaces / newlines)  
* Normalize/dedupe; enrich via PubMed/CrossRef/CT.gov  
* **Ignore empty tokens/rows** (no blank records)  
* Enforce throttle/backoff (see §4)

**Empty/Blank fields:**
* **Import:** ignore blanks; never overwrite existing values with blanks
* **Export:** include columns; blanks output as **empty strings** (`""`) — never `null`/`undefined`

**Validation:**
* PMID is 6–9 digits; DOI pattern; NCT pattern
* Urgency ∈ {Low, Normal, High, Urgent} (default Normal)
* Status ∈ {New, In Progress, On Hold, Fulfilled, Canceled} (default New)

---

## 6) Record Cards & Tags (no DOM restructuring)
- MeSH chips selectable (filter on click), color-coded.  
- CT.gov chips for **sponsor/phase/status** selectable & color-coded.  
- Specialty chip derived from MeSH/journal.  
- Custom field chips shown in cards; no new table columns.

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
> Follow `PLAYBOOK_v2.0_MASTER.md` and `AGENT_POLICY.md` **exactly**.  
> Preserve the v1.2 UI (no DOM/CSS changes).  
> Build a single-file `dist/SilentStacks_v2_monolith.html` (no CDNs).  
> Implement all v2.0 features, run tests, generate screenshots/docs, and package `SilentStacks_Release.zip`.  
> **PR-only** against `main`. Do **not** push directly to `main`.  
> **Pause for approval** before any DOM/CSS edits; provide diffs + screenshots.