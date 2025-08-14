# SilentStacks – Master Playbook (v1.2 → v2.0)
**Merged:** 2025-08-12 14:45

**Repo URL:** https://github.com/patrick1981/SilentStacksTest  
**Primary branch:** main  
**Working branch:** main (PR-only; no direct pushes)  
**Review model:** Solo maintainer may self-merge after checklist + artifacts

> **LIVING DOCUMENT** — Update on every run.

## Baseline Declaration
- v1.2 UI is the contract. Keep IDs/classes/roles/tab markup.
- **Exception (approved 2025‑08‑12):** Minimal DOM additions allowed to meet v2.0 scope:
  - Add **NCT ID** + **NCT Title** fields in Add Request.
  - Add **MeSH** / **CT.gov** **chips** containers (cards/table/preview).
  - Document all additions (IDs, ARIA, screenshots).

## Deliverables
- Single-file monolith: `dist/SilentStacks_v2_monolith.html` (all inline, no CDNs).
- Release ZIP: monolith + `RELEASE_NOTES.md` + `GAP_REPORT_v2.0.md` + updated docs.

## Phased Roadmap
- **A — Hardening & Parity:** SW, error boundaries, exporters, no boot errors.
- **B — Enrichment & Cross-Pop:** PubMed/CrossRef/CT.gov, bulk paste/upload, ID cross-linking, MeSH ≤8.
- **C — A11y (WCAG 2.2 AAA):** Light default; Dark/HC optional; labels/roles/skip links/live regions.
- **D — Offline-First:** queue lookups/exports; retry on reconnect.
- **E — Search/Filter:** fuzzy + fielded; sortable table.
- **F — Intelligence:** synonyms, MeSH hierarchy, specialty detection, trends.
- **G — CT.gov Tagging:** sponsor type, phase, overall status chips (selectable).

## Data & Security
- Validators: PMID `^\d{6,9}$`, DOI `^10\.\d{4,9}/\S+$`, NCT `^NCT\d{8}$`.
- Sanitize inputs, escape all outputs; encode all identifiers; allow-list params.

## Tests (must pass)
Boot, Lookup (PMID/DOI/NCT), Bulk, Enrichment/Merge, Search, Export, Offline, A11Y.
Artifacts: screenshots of Dashboard/Add/All/Import‑Export/Settings.

## Documentation Package (Merged)
**This playbook bundles the provided v1.4 documentation for historical continuity and QA coverage.**  
Treat **v1.4 features** as **non-regression requirements** for v2.0.  
Included in `documentation/v1.4/`:

---

## Bulk Paste & Bulk Upload Requirements (v2.0)

### Source of Truth
- **Single Request Engine:** `test.html` logic defines the enrichment flow for PMID → DOI/NCT → MeSH.
- **Bulk Flows:** Must reuse the same enrichment pipeline for each identifier.

### Supported Inputs
- **Bulk Paste:** mixed tokens (PMID, DOI, NCT) in any order.
- **Bulk Upload:** `.txt`, `.csv`, `.json`.

### Token Recognition (case/format tolerant)
- PMID: `\b\d{6,9}\b`
- DOI: `\b10\.[^\s"']+\b`
- NCT: `\bNCT\d{8}\b` (i)

### CSV Parsing Rules
1. If headings present, use recognized columns (tolerant):  
   - PMIDs: `pmid`, `pubmed id`, `pm_id`  
   - DOIs: `doi`  
   - NCTs: `nct`, `nct id`, `clinicaltrials id`
2. If none found, fallback to regex across all cells.
3. Mixed-type in one file supported.

### TXT & JSON
- TXT: delimiter-agnostic via regex; dedupe; preserve order.
- JSON: accept `{ pmids:[], dois:[], ncts:[] }` or an array of objects with `pmid/doi/nct` keys.

### Processing Contract (per item)
- Route by type, enrich fully (PMID→PubMed→(DOI?)→(NCT?)→MeSH; DOI→CrossRef→(PMID?)→(NCT?)→MeSH; NCT→CT.gov→(article?)→MeSH).
- Populate UI via selector map; prepend a Requests row.
- Announce progress in `#ss-live`; rate limit ~2/sec; continue on errors.

---

# Appendix — Selector Map & Integration Contracts (AI-Compatible)

> Update selectors only. Do not alter engine logic.

```json
{
  "$schema": "https://example.com/silentstacks/selector-map.schema.json",
  "version": "2.0",
  "notes": "Update ONLY selectors to match the current UI. Leave keys intact.",
  "buttons": {
    "lookup_pmid": "#lookup-pmid",
    "lookup_doi": "#lookup-doi",
    "lookup_nct": "#lookup-nct",
    "bulk_paste": "#bulk-paste-btn",
    "bulk_upload": "#bulk-upload-btn"
  },
  "inputs": {
    "pmid": "#pmid",
    "doi": "#doi",
    "nct": "#nct",
    "title": "#title",
    "authors": "#authors",
    "journal": "#journal",
    "year": "#year",
    "volume": "#volume",
    "pages": "#pages",
    "tags_text": "#tags",
    "patron": "#patron-email",
    "status": "#status",
    "priority": "#priority",
    "docline": "#docline"
  },
  "clinical_trials": {
    "phase": "#gl-phase",
    "status": "#gl-ct-status",
    "sponsor": "#gl-sponsor",
    "nct_title": "#gl-nct-title, #nct-title"
  },
  "chips": {
    "mesh": "#gl-chips, #mesh-chips, #nct-suggestion-chips"
  },
  "bulk": {
    "paste_textarea": "#bulk-paste-data",
    "upload_input": "#bulk-upload"
  },
  "table": {
    "requests_tbody": "#requests-table tbody"
  },
  "status_regions": {
    "live": "#ss-live",
    "pmid": "#pmid-status",
    "doi": "#doi-status",
    "nct": "#nct-status"
  }
}
```

**Adapter outcomes (idempotent):** Single request fills biblio + DOI/NCT, populates trial fields, merges MeSH, renders chips, adds Requests row, sets status (“Done • NCT linked” on trial). Bulk flows reuse same pipeline per item.

---

## 📜 SilentStacks Changelog — v1.2 → v2.0

### v1.2.0 – Enhanced Data Edition (Production Baseline)
- Add Request (PMID/DOI), PubMed enrichment, CrossRef DOI, manual NCT fields.
- MeSH (≤8) in text field; Requests table; validators & security.
- Basic bulk paste/upload groundwork.

### v1.2.1 – Performance Apocalypse Edition
- Reduced redundant API calls; faster boot; early rate limiting; listener cleanup.

### v1.3 – Complete Workflow Edition
- CRUD polish; CSV/JSON export; NLM export (alpha); audit trail; a11y upgrades.

### v1.4 – Enhanced Medical Intelligence Edition
- ClinicalTrials.gov integration (auto NCT + trial metadata).
- MeSH chips, specialty detection, evidence levels.
- Offline queueing, background sync, improved SW; multi-theme.
- Robust error recovery; optimized parsing.

### v2.0.0 – Monolithic Offline-First Edition (In Progress)
- Single-file build; **PMID↔DOI↔NCT** full pipeline; CT.gov tagging.
- Bulk paste/upload (TXT/CSV/JSON), mixed-type aware.
- NLM export wired; v1.2 UI with approved new fields/chips.
- SW caching + queued calls; WCAG AAA.
