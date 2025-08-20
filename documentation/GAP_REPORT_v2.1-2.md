Got both GAP Reports — nice work keeping them detailed but complementary. Here’s the **unified GAP REPORT v2.1** that merges the **status/overview tables + narrative** from the first doc with the **compliance/security matrices & acceptance checks** from the second.

---

# 🕳️ SilentStacks – GAP REPORT v2.1 (Unified)

**Run date:** 2025-08-20
**Branch:** v2.1-draft
**Maintainer:** Solo + AI-assisted

---

## 1. Baseline & Context

* **Origin:** Forked from v2.0 after repeated CORS and service worker instability.
* **Mandate:** Carry forward all v2.0 features, explicitly patch worst-case scenarios, and ensure AAA accessibility.
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
* **Titles-only Dump with Typos** → fuzzy match; below threshold remains dirty (no silent fill).
* **CSV Junk** → commas in quotes, Excel artifacts handled with robust parser, fallback regex.

---

## 5. Compliance Matrices

### WCAG 2.2 AAA Conformance Matrix (v2.1)

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

### Security Conformance Matrix (v2.1)

| Risk                 | Control                                 | Status            |
| -------------------- | --------------------------------------- | ----------------- |
| XSS                  | Escape HTML/attributes; sanitize inputs | ✅ Met             |
| API Injection        | Regex validation; URL-encode params     | ✅ Met             |
| CORS Misuse          | CT.gov API calls disabled; linkout only | ✅ Met             |
| Data Leakage         | Exports normalized; `"n/a"` enforced    | ✅ Met             |
| Storage Safety       | IndexedDB cleanup of malformed blobs    | ⚠ Pending (audit) |
| Dependency Integrity | Pin libraries; SRI hashes for CDN       | ⚠ Pending         |

---

## 6. Priorities to Close v2.1

1. Wire MeSH & CT.gov chips into cards + table.
2. Bind bulk update/delete to UI controls.
3. Harden Service Worker (esp. background sync).
4. Run AAA accessibility audit + remediate.
5. Perform final injection/XSS penetration test.
6. Archive v2.0 docs and freeze v2.1 baseline for release packaging.

---

## 7. Release Decision

* **Ready for Production?** → ⚠️ Not yet.
* **Blockers:** SW stability + Accessibility AAA.
* **Deployable as Demo?** → ✅ Yes (stable enough for trial/departmental demo).

---

## 8. Acceptance Checks

* AAA + Security matrices verified.
* Worst-case scenarios simulated.
* Exports validated (clean-only & full) with `"n/a"` preserved.
* UI checkpoint/resume tested under close/reopen.

---

**Bottom line:** SilentStacks v2.1 **closes many v2.0 gaps** and introduces explicit dirty-data and worst-case handling.
It is **demo-stable but not yet production-stable** until Service Worker + Accessibility AAA are complete.

---

✅ That’s your **merged GAP REPORT v2.1**.

Do you want me to keep doing this pass-by-pass (every doc pair → unified doc), or should I stage them all into a **single master “SilentStacks Documentation Pack v2.1”** with TOC?
