# 📋 SilentStacks Feature List – v2.1

**Origin:** Built from v1.2 → v2.0 (failed pivot) → v2.1 (current stable track).
**Purpose:** Provide a clear list of implemented, pending, and worst-case scoped features.
**Audience:** Developers, testers, and project leads.

---

## 1. Core Metadata Operations

* **PMID Lookup (PubMed ESummary/EFetch)**

  * Populates title, authors, journal, year.
  * Retrieves DOI, cross-links NCT IDs.
  * Deduplicates against existing table entries.

* **DOI Lookup (CrossRef)**

  * DOI normalization + sanitization.
  * Metadata backfill: title, authors, journal, year.
  * Cross-links PMID/NCT if available.

* **NCT Lookup (ClinicalTrials.gov)**

  * Study title, sponsor, phase, status.
  * Linked trial details displayed in chips.
  * Enrichment merges with PubMed data when dual-linked.

---

## 2. Bulk Operations

* **Bulk Paste (textarea)**

  * Mixed PMIDs/DOIs/NCTs accepted.
  * Regex-based extraction + dedupe.
  * Token order preserved.

* **Bulk Upload (CSV/TXT/JSON)**

  * CSV with or without headers.
  * TXT delimiter-agnostic.
  * JSON arrays (`pmid`, `doi`, `nct`) supported.

* **Commit Options**

  * *Commit Clean*: Only validated rows saved.
  * *Commit All*: All rows saved, dirty flagged for follow-up.

* **Recovery**

  * Dirty-only export (CSV/Excel).
  * Progress indicator with checkpoint resume.
  * Hard cutoff at **50,000 rows**.

---

## 3. Tagging & Classification

* **MeSH Integration**

  * Retrieved ≤ 8 per record.
  * Deduped into text + chip format.
  * Auto-added chips labeled `[data-auto]` for later filtering.

* **Clinical Trials Tags**

  * Sponsor, Phase, Status chips.
  * Fully filterable and exportable.

---

## 4. UI & Accessibility

* **Contract**: 1.2 sidebar, tabs, table preserved.
* **AAA Accessibility**

  * ARIA roles for table, forms, chips.
  * Screen reader announcements for progress/errors.
  * High-contrast/light/dark themes (all P0).
* **Visual Cues**

  * Dirty rows highlighted in color.
  * Chips visually distinct (mesh vs ct vs custom).

---

## 5. Security & Validation

* **Validators**: PMID (6–9 digits), DOI (10.xxxx/), NCT (NCT########).
* **Sanitization**: Escape HTML/scripts on input & render.
* **API Injection Prevention**: URL encoding of IDs.
* **Error Logging**: Max 50 recent stored client-side.

---

## 6. Offline & Persistence

* **IndexedDB** for requests (large datasets).
* **localStorage** for config/state.
* **Service Worker**

  * App shell caching.
  * Background sync for queued API requests.
* **Resume Flow**: Interrupted bulk import resumes from checkpoint.

---

## 7. Export & Interop

* **Exports**: CSV/Excel re-import safe.
* **Modes**: Clean-only vs Full dataset.
* **NLM Citation Format** enforced.
* **Dirty rows** → “n/a” markers instead of blanks.

---

## 8. Worst-Case Scenarios

* **Single Bad Token**: Fail gracefully, suggest manual search.
* **Mass Dump (500k rows)**: Reject at 50k cutoff.
* **Mixed Dirty Data**: Highlight dirty, allow commit-all/export.
* **Network Loss**: Resume imports when reconnected.

---

## 9. Future-Proofing

* **2.2+ hooks** (not in current build):

  * Predictive synonyms.
  * MeSH hierarchy traversal.
  * Discipline specialty detection.
  * Heatmap/urgency triage by trial phase.
  * Custom fields import/export.

---

✅ **Codified in v2.1**: Bulk ops with cutoff, PubMed/CrossRef/NCT lookups, chip tagging, accessibility AAA, dirty row handling, offline-first storage.
⚠️ **Still Pending**: Full service worker sync reliability, advanced MeSH wiring, predictive synonyms.

Do you want me to **print the Executive Summary next**, or should I pause so you can confirm this Feature List v2.1 is good before generating the rest?
