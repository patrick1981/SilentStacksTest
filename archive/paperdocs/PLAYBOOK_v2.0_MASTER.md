
# SilentStacks – Master Playbook (v1.2 → v2.0)
**Status:** Living document · Updated 2025-08-11  
**Owner:** Agent Mode (lead dev)  
**Goal:** Deliver a single-file, offline-first, AAA-accessible monolith that extends v1.2 UI with v2.0 features **without breaking** the v1.2 UI contract.

---

## 0) Baseline & Guardrails
- **UI Contract (v1.2):** Preserve DOM structure, semantics, and visual hierarchy of v1.2. New features must **not** rename or remove existing IDs/classes/ARIA roles used by tests. Additions use new IDs.
- **Monolith Requirement:** One self-contained HTML file (inline CSS & JS). No external libs/CDNs.
- **Tech-Agnostic:** No Excel/Office-specific logic. CSV/JSON only.
- **Offline Constraints:** Service Worker (SW) must not register on `file://`. Guard registration to `http(s)` only.
- **Privacy:** All data in localStorage only. No telemetry.

---

## 1) Feature Scope (v2.0)
### 1.1 Identifiers & Enrichment
- Lookup by **PMID**, **DOI**, **NCT** with cross-population.
- From **PMID**: PubMed ESummary; prefer API key if provided; extract authors, title, journal, year, volume/issue/pages, DOI; infer NCT from text; collect MeSH when available.
- From **DOI**: Crossref works; optional **PMID resolution** via NCBI eSearch `[DOI]`.
- From **NCT**: ClinicalTrials.gov v2 brief title and identifiers.
- MeSH chips (up to 8), non-blocking render.

### 1.2 Bulk Operations
- **Bulk Paste:** Accept mixed identifiers (PMID/DOI/NCT). Normalize/dedup. Show progress & stats. Rate-limit and backoff.
- **Bulk File Import:** CSV/JSON flexible schema; enrich missing bibliographic fields post-import (if online).

### 1.3 Search / Filter / Sort
- Full-text across title, authors, journal, ids, tags, MeSH. Prefer fuzzy matching. Status/priority filters. Sort by date/priority/title/status.

### 1.4 Views & Actions
- Card/Table toggle with columns: Urgency, Docline, PMID, Citation, Patron, Status.
- Multi-select & delete in table view. Inline status updates.

### 1.5 Export
- JSON, CSV, NLM citation (one per line).

### 1.6 Follow-up
- N-day threshold (default **5**) configurable. Dashboard shows counts; cards flagged visually.

### 1.7 Settings
- Theme (**Landio Light/Dark/HC**), Follow-up Days, PubMed API key, Crossref mailto, SW enable toggle. Persist across sessions.

### 1.8 Offline-first
- Optional SW caching (guarded for http/https).  
- **Offline queue**: queue lookups/actions performed while offline, replay on reconnect.

### 1.9 Accessibility (WCAG 2.2 AA/AAA targets)
- Tabs: ARIA roles, `aria-controls`, roving `tabindex`, ArrowLeft/Right/Home/End.
- Global `:focus-visible` outline; error handling with `aria-invalid`, inline error text, error summary.
- Live regions for lookup/import statuses.
- Table headers `scope="col"`. Color contrast verified in Light/Dark/HC.

---

## 2) Architecture (Monolith)
- **index.html** (single file):  
  - `<style>`: tokens, themes, components.  
  - `<script>`: modules (grouped by section):
    - **State**: localStorage serialization; schema version.
    - **API Clients**: PubMed, Crossref, CT.gov with helpers, throttling/backoff.
    - **Enrichment**: mapping + field fill without overwriting typed values.
    - **UI/UX**: tabs, forms, views, filters, fuzzy search, toasts (optional).
    - **I/O**: CSV/JSON parser & exporters, NLM formatter.
    - **Offline**: SW blob registration & offline queue.
    - **A11y**: focus management, validation helpers, live regions.
- **Data Model (record)**:
```js
{
  id, createdAt, updatedAt,
  pmid, doi, nct, docline,
  title, authors:[], authorsText, journal, year, volume, issue, pages,
  patronName, patronEmail,
  priority: 'normal'|'rush'|'urgent',
  status: 'pending'|'in-progress'|'fulfilled'|'cancelled',
  tags: [], notes
}
```
- **State Key:** `silentstacks:v2` (+ `:queue` for offline tasks).

---

## 3) API Compliance & Limits
- **NCBI**: prefer API key; **≤ 3 req/sec**; default to **≤ 2 req/sec**. Exponential backoff on 429/5xx (600ms, 1200ms, 2400ms).  
- **Crossref**: include `mailto` parameter when provided; courteous request cadence.  
- **CT.gov**: REST v2; standard GET.

---

## 4) Acceptance Criteria (AT)
1. **Single Lookups:** PMID/DOI/NCT populate fields; PMIDs resolve DOI (when present); DOI resolves PMID when resolvable.
2. **Bulk Paste:** Mixed identifiers processed; progress visible; rate ≤ 2/sec; backoff on errors; final stats shown.
3. **Bulk File Import:** CSV/JSON adds records; optional enrichment pass fills missing fields.
4. **Search/Filter/Sort:** Fuzzy matches; filters combine; sorts stable.
5. **Views:** Table columns exact; select/delete; status edits persist.
6. **Export:** JSON/CSV/NLM produce correct counts/format.
7. **Follow-up:** Threshold respected; dashboard counters accurate.
8. **Settings:** Persisted and applied; SW only on http/https.
9. **A11y:** Keyboard tabs; error states announced; focus-visible on all interactive elements; contrast OK in all themes.
10. **Offline:** With SW enabled on https, app loads offline; offline queue replays on reconnect.

---

## 5) Test Plan (Manual)
- Seed 5 demo records; run through AT 1–10.
- Toggle themes; re-check contrast & focus outlines.
- Simulate offline: DevTools “Offline” → add requests & lookups → go online → verify replay.

---

## 6) Work Sequencing (Agent)
1. Bulk Paste generalization + throttle/backoff.
2. DOI→PMID resolver; post-import enrichment pass.
3. A11y polish: focus-visible, inline errors, error summary.
4. Fuzzy search (tiny scorer or Fuse re-enable).
5. Offline queue + SW guard verification.
6. Optional: PubMed EFetch fallback for MeSH/abstract when ESummary lacks it.
7. Add Test Seed button in Settings (dev-only).

---

## 7) DOM Contract Additions (v2.0)
- **IDs (new):** `#toggle-view`, `#tbody`, `#cards`, `#pmid-status`, `#doi-status`, `#nct-status`, `#bulk-progress`, `#bulk-fill`, `#bulk-text`, `#bulk-status`.
- **Roles:** tablist/tab/tabpanel present; live regions on status divs.
- **No removals** of v1.2 identifiers.

---

## 8) Risk & Rollback
- If enrichment services rate-limit, the app continues with partial data and retries later via queue.
- SW toggled off by default; safe on `file://` to avoid registration errors.
- All writes are localStorage; export before clearing to avoid data loss.

---

## 9) Changelog (maintained by agent)
- **v2.0.0**: Monolith with identifier triad, enrichment, bulk ops, filters/sorts, table/card, exports, follow-up, settings, optional SW, AAA improvements.
