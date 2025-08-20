
* **Playbook v2.1** (already mostly solid, but I’ll expand & ensure it fully reflects our discussions including dirty-data, worst-case, and P0 items)
*
---

# 📘 SilentStacks Playbook v2.1 (Draft)

**Origin:** Forked from v2.0 on 2025-08-19
**Status:** Draft — under active refactor
**Note:** All content from 2.0 has been carried forward.
Overlaps, outdated items, and redundancies will be resolved during section reviews.

---

## 1. Client-Side Data Architecture & Limits (P0)

* **All client-side.** IndexedDB (requests, bulk jobs), localStorage (settings/state).
* **Hard Cutoff:** Max **50,000 rows** per bulk job. Anything larger → reject.
* **Rate Limits:** PubMed calls throttled to ≤ 2/sec.

  * Worst case: 50k run ≈ 7 hrs.
* **Checkpointing:** Progress indicator w/ resume capability.
* **Dirty Data Handling:**

  * Invalid rows highlighted (red/orange).
  * Options:

    * **Commit Clean Only** → commit valid rows only.
    * **Commit All** → commit everything, but dirty rows flagged for later.
  * **Recovery:** Export dirty-only set for offline cleaning and re-import.
* **Accessibility:** AAA baseline; Light, Dark, and High Contrast themes are **P0**.

---

## 2. Add Request (Single Entry)

* Paste PMID, DOI, or NCT → metadata fetch (PubMed/CrossRef/CT.gov).
* Deduplication & cross-checks across IDs.
* Manual fill for missing fields, librarian tagging.
* Save → auto-commit to table + card view.
* **UI:** v1.2 contract preserved (tabs, IDs, roles). Only status/error badges + theming added.

---

## 3. Bulk Operations

* Sources: Clipboard paste, CSV/XLS upload, raw text.
* Normalize tokens → route by type.
* **Edge Cases:**

  * Mixed valid/invalid identifiers.
  * Titles-only, misspelled text.
  * Excel junk fields.
  * Doctor’s “email dump” with half-baked identifiers.
* **Commit paths:**

  * Auto-commit obvious matches.
  * Librarian confirmation for uncertain matches.
  * “Commit Clean” vs “Commit All” toggle.

---

## 4. Worst-Case Scenarios

* **Singleton:** Garbage PMID/DOI → fail gracefully, suggest manual search.
* **Bulk Flood:** 500k rows attempted → reject (50k cutoff).
* **Network Loss:** Resume from checkpoint.
* **Mixed Dirty Data:** Dirty rows flagged, export enabled.
* **Machine Hog:** 5+ hour runs handled by checkpointing + pause/resume.

---

## 5. Accessibility & Theming

* AAA compliance: ARIA labels, skip links, live regions, keyboard nav.
* Theme switching: light / dark / high-contrast.
* Propagates consistently to forms, tables, cards, modals.

---

## 6. Exports & Interop

* Strict NLM citation format enforced.
* Export “clean-only” vs “full set.”
* Dirty rows use `n/a` placeholders, not blanks.
* Round-trip safe: exports can be re-imported for retry.

---

## 7. Security & Storage

* Input sanitization (escape HTML/scripts).
* API URLs encoded, no injection possible.
* IndexedDB for requests (scalable).
* LocalStorage for settings only.
* Error log capped at 50 entries.

---

