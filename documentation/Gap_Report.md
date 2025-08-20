# 📊 Gap Report v2.1

**Run date:** 2025-08-20
**Build:** index.html + app.min.js + sw\.js + dependencies.min.js (current GitHub Pages live)

---

## ✅ Completed

* Client-side IndexedDB + localStorage persistence.
* Bulk parser with PMID/DOI/NCT recognition (regex-based).
* PubMed enrichment (DOI + MeSH up to 8).
* CrossRef enrichment with PMID backfill.
* NCT enrichment (trial metadata → phase, status, sponsor, title).
* Commit Clean vs Commit All toggle.
* Export with round-trip support.
* Accessibility baseline (labels, roles, nav).
* Service Worker registration (basic cache).

---

## ⚠️ Partial / Needs Refinement

* **Dirty Data Workflow:** Highlighting works, but filtering/export paths incomplete.
* **Progress Indicator:** Bulk progress visible, but no checkpoint/resume yet.
* **Service Worker:** Caching works, but background sync + queue retry incomplete.
* **Theming:** Light/Dark implemented; High Contrast partial.
* **Chips:** Render in preview; table/card integration pending.
* **Bulk Update/Delete:** Hooks exist, but not fully wired to UI.

---

## ❌ Missing / Not Started

* **Checkpoint Resume:** Long import resume after crash/reload.
* **Export Dirty-only Rows:** Option stubbed, not wired.
* **MeSH Chips Filtering:** Chips render, but filter logic missing.
* **Accessibility Audit:** Contrast AA tested, AAA not yet verified.
* **CT.gov Tagging in Cards/Table:** Only preview-level, not in persistent views.
* **Final Documentation Set:** Most docs are stubs (only Playbook full).

---
