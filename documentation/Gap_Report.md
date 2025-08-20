# 🕳️ SilentStacks – GAP REPORT v2.1

**Run date:** 2025-08-20
**Branch:** v2.1-draft
**Maintainer:** Solo + AI-assisted

---

## 1. Baseline & Context

* **Origin:** Forked from v2.0 after repeated CORS and service worker instability.
* **Mandate:** Carry forward **all v2.0 features**, explicitly patch worst-case scenarios, and ensure AAA accessibility.
* **Scope:** Offline-first, client-side only (no backend).

---

## 2. Status Overview

| Area                   | v1.2 Status          | v2.0 Attempt           | v2.1 Current     | Notes                                                              |
| ---------------------- | -------------------- | ---------------------- | ---------------- | ------------------------------------------------------------------ |
| Core UI Contract       | ✅ Stable             | ⚠️ Partially broken    | ✅ Preserved      | Sidebar, tabs, IDs/classes intact                                  |
| PMID Lookup (PubMed)   | ✅ Basic              | ✅ Enriched (DOI, MeSH) | ✅ Stable         | 2-step fetch (ESummary + EFetch)                                   |
| DOI Lookup (CrossRef)  | ❌ Absent             | ✅ Implemented          | ✅ Stable         | Normalization + backfill to PMID                                   |
| NCT Lookup (CT.gov)    | ❌ Absent             | ✅ Implemented          | ⚠️ Partial       | Phase/sponsor/status chips working; row rendering incomplete       |
| MeSH Tagging           | ❌ Absent             | ⚠️ Preview only        | ⚠️ Partial       | Chips render in preview; need table/card wiring                    |
| Bulk Paste             | ✅ Basic              | ✅ Expanded             | ✅ Stable         | Mixed ID parsing, dedupe, resume                                   |
| Bulk Upload (CSV/JSON) | ❌ Absent             | ⚠️ Added               | ✅ Stable         | CSV headings, TXT regex, JSON formats                              |
| Bulk Update/Delete     | ✅ Basic              | ❌ Broken               | ⚠️ Partial       | Commit clean/all toggles working; update/delete workflow not wired |
| Offline (SW + IDB)     | ⚠️ LocalStorage only | ⚠️ Unstable            | ⚠️ Partial       | IndexedDB stable; SW caching still brittle                         |
| Export CSV/Excel       | ✅ Basic              | ✅ Expanded             | ✅ Stable         | Clean vs full dataset exports; re-import safe                      |
| Accessibility (AAA)    | ⚠️ Partial           | ⚠️ Partial             | ⚠️ Pending audit | Keyboard/contrast ok; chip ARIA roles incomplete                   |
| Security/Sanitization  | ❌ Minimal            | ⚠️ Pass 1              | ⚠️ Pass 2        | Injection mostly blocked; needs final audit                        |

---

## 3. Key Gaps (⚠️ / ❌)

1. **MeSH Chips** → show in preview but not cards/table.
2. **NCT Chips** → metadata flows, but row population incomplete.
3. **Bulk Update/Delete** → logic present, but not bound to UI.
4. **Service Worker** → caching unreliable across browsers (offline shell works, API queue buggy).
5. **Accessibility Audit** → Lighthouse AA compliance ok, but AAA contrast + chip roles missing.
6. **Security Audit** → second pass complete; need one more XSS/URL injection review.

---

## 4. Worst-Case Scenario Handling (v2.1 P0)

* **50k Hard Cutoff** → enforced on bulk imports.
* **Dirty Data** → highlighted rows; commit-clean vs commit-all.
* **Network Loss** → checkpoint + resume implemented.
* **Export Dirty Rows** → CSV path enabled for cleaning/reimport.
* **Doctor Email Dump Case** → mixed DOIs/PMIDs/titles normalized and flagged.

---

## 5. Priorities to Close v2.1

1. Wire MeSH & CT.gov chips into cards + table.
2. Bind bulk update/delete to UI controls.
3. Harden Service Worker (esp. background sync).
4. Run AAA accessibility audit + remediate.
5. Perform final injection/XSS penetration test.
6. Archive v2.0 docs and freeze v2.1 baseline for release packaging.

---

## 6. Release Decision

* **Ready for Production?** → ⚠️ Not yet.
* **Blockers:** SW stability + Accessibility AAA.
* **Deployable as Demo?** → ✅ Yes (stable enough for trial/departmental demo).

---

**Bottom line:**
SilentStacks v2.1 closes many v2.0 gaps and introduces explicit dirty-data and worst-case handling. It is **demo-stable but not yet production-stable** until Service Worker + Accessibility AAA are complete.

---

👉 Next logical doc to regenerate would be the **Developer Guide v2.1**, since it’s the main handoff piece for technical implementers. Want me to do that one next?
