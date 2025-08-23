# SilentStacks – Master Playbook (v1.2 → v2.0)

**Repo URL:** https://github.com/patrick1981/SilentStacksTest
**Primary branch:** main
**Working branch (agent):** feature/v2.0-monolith

> **LIVING DOCUMENT** — Agent must treat this file as living and update docs each run.

## Baseline Declaration (Read First)

**Baseline Preservation — CRUD Operations**  
All record management functions present in v1.2 — including single-record edit, bulk update, and bulk delete — **must remain fully functional** in v2.0.  
- UI/UX for these actions must remain identical to v1.2 (no relocation, no renaming of buttons).  
- Implementation may be refactored, but behavior and keyboard accessibility must match.  
- Any loss of this functionality is considered a **baseline regression** and must fail the build.

This repo is a direct replication of SilentStacks **v1.2** and is the immutable baseline.
- Treat current `index.html` and `assets/css/style.css` as **read-only UI contract**.
- Do **not** change DOM structure, IDs, classes, ARIA roles, tab markup, or the 3-step indicator.
- Any DOM/CSS change requires rationale, DOM/CSS diff, before/after screenshots, and explicit approval.
- **Fail the run** if DOM/CSS diffs alter IDs/classes/roles or tab/stepper structure.

**Baseline verification (must run once at start):**
1) Snapshot DOM of the live v1.2 UI.
2) Compare `index.html` against v1.2 reference; assert 0 structural diffs.
3) Confirm CSS selectors for tablist, panels, inputs, buttons are unchanged.
4) Save results to `RELEASE_NOTES.md`.

---

## 0) UI Contract (Non-Negotiable)
- No frameworks (Bootstrap/Tailwind/CDNs).
- No changes to IDs, classes, ARIA roles, tab markup, 3-step indicator.
- New features: JS-only injection, no DOM restructuring.
- Missing referenced files → create stubs.
- Default theme = Light; Dark/HC toggle only.
- Fail run on DOM/CSS drift.

---

## 1) Deliverables
- One file: `dist/SilentStacks_v2_monolith.html` (CSS/JS inlined, no CDNs).
- Release ZIP: monolith, `RELEASE_NOTES.md` (with screenshots), `GAP_REPORT.md`, updated docs.

---

## 2) Phased Roadmap (v1.2 → v2.0)

### Phase A — Hardening & Parity
- Service Worker + cache manifest.
- Error boundary + aria-live notifications.
- Exporters: JSON, CSV, NLM.
- Tests: no uncaught errors on boot; keyboard traversal.

### Phase B — Enrichment & Cross-Population
- API clients with rate limits.
- Bulk Paste/Upload (PMID/DOI/NCT).
- Cross-populate identifiers; merge sources; log conflicts.
- MeSH auto-tagging (≤8) as selectable, color-coded chips in cards/details.

### Phase C — Accessibility (WCAG 2.2 AAA)
- Theme toggle with persistence.
- Labels, names/roles/values; 7:1 contrast; skip links; visible focus.
- Full keyboard-only flows.

### Phase D — Offline-First
- Queue lookups/exports offline; retry on reconnect.
- Offline boot verification; cache integrity check.

### Phase E — Search/Filter Upgrades
- Fuse.js search; fielded + ranking.
- Sort & filter bound to table headers/inputs.

### Phase F — Extended Intelligence
- Predictive synonyms for search.
- MeSH hierarchy awareness.
- Specialty detection.
- Urgency heat map.
- Trends dashboard.
- Custom fields import/export.

### Phase G — ClinicalTrials.gov Tagging
- Sponsorship tag (industry, academic, government).
- Phase tag (I, II, III, IV).
- Test status tag (Recruiting, Completed, etc.).
- All CT tags color-coded, selectable.

---

## 3) Feature Checklist
- Offline-first, SW + queue.
- Bulk import/export (paste/CSV/JSON), dedupe/normalize.
- Cross-populate PMID/DOI/NCT.
- Enrichment: PubMed, CrossRef, ClinicalTrials.gov.
- MeSH auto-tags ≤8, selectable/color-coded.
- CT tags: sponsorship, phase, status — color-coded/selectable.
- Predictive synonyms.
- MeSH hierarchy.
- Specialty detection.
- Urgency heat map.
- Trends.
- Custom fields import/export.
- Advanced search/filter.
- Status/Priority/Tags with chips.
- NLM citation export.
- WCAG 2.2 AAA (Light default, Dark, HC).
- Security: sanitize inputs/outputs, prevent XSS/API injection.
- No DOM/CSS drift.

---

## 4) Data, API & Security
- Record model: adds `meshTree`, `specialty`, `custom`, `ctTags`.
- Sanitize all inputs; strip HTML; escape all output; validate API inputs.
- Rate limits: PubMed ≤ 2/sec, CrossRef ≤ 5/sec, CT.gov ≤ 1/sec.
- Retries: exponential backoff; 30s timeouts; visible errors.

---

## 5) Table & Data Rules
- Column order: Urgency | Docline Number | PMID | Citation | Patron Name | Status.
- Exact headings enforced.
- Bulk paste/upload rules with enrichment.
- No overwrites with blanks.
- Exports: blanks as empty strings.
- Validation: PMID digits, urgency/status enums.

---

## 6) Record Cards & Tags
- MeSH chips selectable, color-coded.
- CT tags for sponsorship, phase, status.
- Specialty chips.
- Custom field chips.

---

## 7) Tests
- Boot, Lookup (PMID/DOI/NCT), Bulk, Enrich, Search, Export, Offline, A11Y.
- Screenshots: Dashboard, Add, All, Import/Export, Settings.

---

## 8) Documentation & Code Quality
- Update docs each run.
- Append "What changed" sections.
- Update CHANGELOG.
- JSDoc for public functions.
- Comment rationale for complex logic.
- Fail run if missing/outdated.

---