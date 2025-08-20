# 📘 SilentStacks Playbook v2.1 (Unified, Patched)

**Origin:** Forked from v2.0 on 2025-08-19
**Status:** Draft — under active refactor
**Maintainer:** Solo + AI-assisted

> **Note:** All content from v2.0 has been carried forward.
> Overlaps, outdated items, and redundancies are being resolved during section reviews.
> **Selector Map** is the AI contract.
> **LIVING DOCUMENT** — update on every run.

---

## 1. Client-Side Data Architecture & Limits (P0)

* **All client-side.** IndexedDB for requests & bulk jobs; localStorage for settings/state.
* **Hard Cutoff:** Max **50,000 rows** per bulk job. Larger → reject.
* **Rate Limits:** PubMed throttled ≤ 2/sec. Worst case: 50k run ≈ 7 hrs.
* **Checkpointing:** Progress indicator with resume capability.
* **Dirty Data Handling:**

  * Invalid rows highlighted.
  * *Commit Clean Only* vs *Commit All* toggle.
  * Recovery path: export dirty-only set for offline cleaning & re-import.
* **Accessibility:** AAA baseline. Light, Dark, and High Contrast themes are P0.

---

## 2. Add Request (Single Entry)

* Input: PMID, DOI, or NCT → metadata fetch (PubMed/CrossRef/CT.gov).
* Deduplication & cross-checks across IDs.
* Manual fill for missing fields; librarian tagging.
* Save → auto-commit to table + card view.
* **UI Contract:** v1.2 preserved (tabs, IDs, roles). Only status/error badges + theming added.

---

## 3. Bulk Operations

* **Sources:** Clipboard paste, CSV/XLS upload, raw text.
* Normalize tokens → route by type.
* **Commit Paths:**

  * Auto-commit obvious matches.
  * Librarian confirmation for uncertain matches.
  * “Commit Clean” vs “Commit All.”

---

## 4. Worst-Case Scenarios (Explicit)

SilentStacks is built to handle **real-world, messy librarian workflows**. Below are explicit cases (see also *GAP REPORT v2.1 §4* for tracking).

### A. Bulk Operations

1. **Doctor Email Dump** → mixed DOIs/PMIDs/titles, Excel artifacts, typos.

   * Normalize tokens, attempt metadata fetch.
   * Obvious matches auto-commit. Uncertain → flagged dirty.
2. **Titles-only Dump w/ Typos** → fuzzy match attempted; below threshold remains dirty (no silent fills).
3. **CSV Junk** → commas in quotes, stray columns, Excel export artifacts handled via PapaParse + fallback regex.
4. **Extreme Bulk Flood (500k rows)** → rejected with message. Librarian told to chunk ≤ 50k.
5. **Dirty Rows** → highlighted, `n/a` enforced for blanks. Can export dirty-only for cleanup and re-import.
6. **Commit Clean vs Commit All** → librarian chooses to commit only validated rows, or everything (dirty rows marked for later bulk update).

### B. Singletons

1. **Garbage PMID/DOI** → fails gracefully with message, suggest manual PubMed/CrossRef search.
2. **NCT ID malformed** → linkout to ClinicalTrials.gov, but no fetch.
3. **Mixed identifiers in one field** (user pastes PMID+DOI) → split parser resolves if possible, else flagged.

### C. Runtime & Network

1. **Network Loss Mid-Run** → checkpoint written to IndexedDB. Resume available on reopen.
2. **Browser Crash / Tab Close** → same checkpoint system allows continuation without data loss.
3. **Long-running Bulk Job (>5 hrs)** → user warned. Progress indicator + pause/resume available.

---

## 5. Accessibility & Theming

* **AAA compliance:** ARIA labels, skip links, live regions, keyboard navigation.
* **Theme switching:** Light / Dark / High-Contrast.
* Propagates consistently across forms, tables, cards, modals.

---

## 6. Exports & Interop

* **Format:** Strict NLM citation format.
* **Export Options:** Clean-only vs full set.
* Dirty rows always `n/a`, never blank.
* **Round-trip safe:** exports can be re-imported for retry.

---

## 7. Security & Storage

* Input sanitization (escape HTML/scripts).
* API URLs encoded, injection-proof.
* IndexedDB for requests (scalable).
* LocalStorage for settings only.
* Error log capped at 50 entries.

---

## 8. Baseline Declaration

* v1.2 UI remains contract (IDs/classes/roles).
* **CT.gov API disabled** — NCT linkouts only (security/CORS).
* Modularized structure authoritative:

```
SilentStacks/
├── index.html
├── /css/
│   └── style.css
├── /js/
│   └── app.min.js
├── /documentation/
│   ├── PLAYBOOK_v2.1.md
│   ├── GAP_REPORT_v2.1.md
│   ├── QUICKSTART_v2.1.md
│   ├── UPKEEP_v2.1.md
│   ├── DEVELOPER_GUIDE_v2.1.md
│   ├── COMPLIANCE_APPENDIX.md
│   ├── COMPLIANCE_APPENDIX_User.md
│   ├── HANDOFF_GUIDE.md
│   ├── PRESERVATION_CHECKLIST.md
│   └── Selector_Map_v2.1.md
```

---

## 9. P0 Requirements

* Bulk ops (PMID/DOI/NCT), throttled, checkpoint/resume.
* Canonical headers (with **Fill Status** last):

```
Urgency | Docline # | PMID | Citation | NCT Link | Patron e-mail | Fill Status
```

* `"n/a"` for all missing fields.
* Dirty-only export available; exports re-import safe.

---

## 10. Security Conformance Matrix (v2.1)

| Risk                 | Control                                 | Status            |
| -------------------- | --------------------------------------- | ----------------- |
| XSS                  | Escape HTML/attributes; sanitize inputs | ✅ Met             |
| API Injection        | Regex validation; URL-encode params     | ✅ Met             |
| CORS Misuse          | CT.gov API calls disabled; linkout only | ✅ Met             |
| Data Leakage         | Exports normalized; `"n/a"` enforced    | ✅ Met             |
| Storage Safety       | IndexedDB cleanup of malformed blobs    | ⚠ Pending (audit) |
| Dependency Integrity | Pin libraries; SRI hashes for CDN       | ⚠ Pending         |

---

## 11. WCAG 2.2 AAA Conformance Matrix (v2.1)

| Guideline             | Success Criterion                                      | Level | Status                                        |
| --------------------- | ------------------------------------------------------ | ----- | --------------------------------------------- |
| 1.4.6                 | Contrast (Enhanced)                                    | AAA   | ✅ Met – ≥7:1 (≥4.5:1 large)                   |
| 1.4.8                 | Visual Presentation                                    | AAA   | ⚠ Pending – preferences panel (spacing/width) |
| 1.4.9                 | Images of Text (No Exception)                          | AAA   | ✅ Met – no text-in-images                     |
| 2.1.3                 | Keyboard (No Exception)                                | AAA   | ✅ Met – full keyboard operability             |
| 2.2.3                 | No Timing                                              | AAA   | ✅ Met – no timeouts                           |
| 2.3.2                 | Three Flashes                                          | AAA   | ✅ Met – no flashing content                   |
| 2.4.8                 | Location                                               | AAA   | ⚠ Pending – breadcrumb indicators             |
| 2.4.9                 | Link Purpose (Link Only)                               | AAA   | ✅ Met – self-describing links                 |
| 2.4.10                | Section Headings                                       | AAA   | ✅ Met – semantic structure                    |
| 2.4.12                | Focus Not Obscured (Enhanced)                          | AAA   | ⚠ Pending – sticky header testing             |
| 2.4.13                | Focus Appearance                                       | AAA   | ✅ Met – thick, high-contrast outline          |
| 3.3.9                 | Accessible Authentication (Enhanced)                   | AAA   | N/A – no authentication                       |
| 1.3.6                 | Identify Purpose                                       | AAA   | ✅ Met – ARIA + autocomplete                   |
| 3.3.7 / 3.3.8         | Redundant Entry / Consistent Help                      | A/AA  | ⚠ Pending – persistent Help affordance        |
| 1.2.6 / 1.2.8 / 1.2.9 | Sign Language / Media Alternatives / Audio-only (Live) | AAA   | N/A – no media                                |

---

## 12. Acceptance Checklist

* ✅ P0 scope validated (bulk ops, headers, n/a fill, linkouts).
* ✅ Security checks (XSS, API injection, CORS).
* ✅ AAA checks (contrast, keyboard, headings, links).
* ⚠ Pending: preferences panel, breadcrumbs, sticky header focus, persistent Help.
* ✅ Worst-case scenarios simulated.
* ✅ Docs cross-linked, timestamps present.



Do you want me to generate the **patched GAP REPORT v2.1** next so it matches this Playbook 1:1?
