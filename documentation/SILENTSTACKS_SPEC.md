# SilentStacks — Canonical Spec (v2.x, Monolithic-first)

> Living specification. Treat this file as the **source of truth**.

## 1) Core Objectives
- Offline-first ILL/request manager.
- Accepts **PMID / DOI / NCT** seeds; supports mixed input.
- Enrichment via **PubMed**, **CrossRef**, **ClinicalTrials.gov** with provenance & conflict reporting.
- WCAG 2.2 **AAA** accessibility, with 3 themes: Landio Light, Landio Dark, Landio HC.
- Export: **NLM citation**, CSV, JSON.
- Single-file **monolithic HTML** deliverable until feature-complete.

## 2) Data Model (canonical)
```
Request {
  id: string, createdAt: ISO, updatedAt: ISO,
  seedType: "PMID"|"DOI"|"NCT"|"Manual",
  identifiers: { pmid?: string, doi?: string, nct?: string },
  title?: string, authors?: string, journal?: string, year?: number,
  volume?: string, issue?: string, pages?: string, abstract?: string,
  mesh?: string[], tags?: string[],
  status: "New"|"In Progress"|"On Hold"|"Fulfilled"|"Canceled",
  priority: "Low"|"Normal"|"High"|"Urgent",
  notes?: string,
  sourceConflicts?: Record<string, string[]>,
  sources: { pubmed?: object, crossref?: object, clinicaltrials?: object }
}
```
**Mandatory:** `id`, `createdAt`, `status`, `priority`, and at least one identifier.

## 3) Inputs & Imports
- **Bulk Paste** text area; accepts mixed IDs; normalizes, dedupes, validates.
- **Bulk Upload** plain text or JSON (no Excel dependency).
- **Cross-population:** PMID↔DOI; detect NCT in abstracts; NCT→PubMed back-link if mentioned.
- Offline queue for imports when network/APIs unavailable.

## 4) Enrichment Rules
- **PubMed:** bibliographic core + MeSH (≤5) + DOI when present.
- **CrossRef:** augment DOI metadata.
- **ClinicalTrials.gov:** NCT title/status/dates.
- Conflicts: write to `sourceConflicts`; choose PubMed as default for core bibliographic fields, but retain alternates.

## 5) Record Management & UI
- Status and Priority fields with sort/filter.
- Color-coded **tag chips** (user-defined) + MeSH tags.
- **Tabbed navigation**: Dashboard, New Request, Bulk Import, Search/Filter, Export, Settings.
- Table: sortable columns, filter row, column visibility, persistent filters.
- Search by identifier/title/author/journal/year/MeSH/status/priority/tag.

## 6) Export
- NLM citation per record and in bulk.
- CSV and JSON exports.
- Offline-capable exports.

## 7) Accessibility (WCAG 2.2 AAA)
- 7:1 contrast minimum; labeled fields; ARIA where appropriate.
- Keyboard-only operability; skip links; visible focus; no traps.
- Theme toggle (Light/Dark/HC) is keyboard-accessible and persists.

## 8) Offline-first
- Service worker caches all assets; cache manifest integrity check.
- Offline queue for new/edited records; retry sync when online.

## 9) Network Handling
- Rate limits: PubMed ≤2/sec; CrossRef ≤5/sec; ClinicalTrials.gov 1/sec (conservative).
- Retries with exponential backoff; 30s timeouts; error notifications.
- Store last-OK responses; provide graceful degradation when APIs fail.

## 10) QA Gates (must pass)
- No uncaught errors at boot or during core flows.
- A11Y AAA audit passes.
- API Contract tests (mocked then live) pass.
- Offline load verified.
- `GAP_REPORT.md` updated; `CHANGELOG.md` updated.
