# SilentStacks Failure Records (Session Extraction)

---

## 1. Major Decisions Made

* **2025-08-12** — Pivoted to **v2.1** after catastrophic **production failure** in v2.0 (CORS + SW instability).
* **2025-08-12** — **CT.gov enrichment removed**; replaced with NCT **linkout-only** approach.
* **2025-08-13** — **Bulk cutoff set at 50,000 rows**.
* **2025-08-13** — **Rate limit capped at ≤2/sec PubMed API calls**.
* **2025-08-14** — **Checkpoint/resume implemented** via IndexedDB.
* **2025-08-15** — **“n/a” normalization rule** established for missing patron data.
* **2025-08-21** — Canon updated to include **Gate 0 Operational Stability Safety** (rehydration + baseline checks before packaging).
* **2025-08-22** — Decision that **all packaging must pass Gate 0–3** with no stubs, placeholders, or missing artifacts before release.

---

## 2. P0 Failures

### **Production Failures (v2.0)**

| Timestamp  | Failure                           | Root Cause                                                              | Corrective Action                                                 | Evidence Snippet                                                           |
| ---------- | --------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 2025-08-12 | v2.0 catastrophic startup failure | CT.gov enrichment (CORS policy crash); RequestManager never initialized | Removed enrichment, pivoted to linkout-only (NCT.gov)             | “SilentStacks v2.0 Diagnostics: Modules 0/13 loaded; CT.gov CORS blocker.” |
| 2025-08-12 | Service worker instability        | Inline enrichment + caching conflicts                                   | Dropped CT.gov calls, hardened SW caching to PubMed/CrossRef only | “CORS + SW instability triggered unrecoverable startup.”                   |

---

### **Modeling / Packaging Failures (v2.1)**

| Timestamp  | Failure                                      | Root Cause                                       | Corrective Action                                  | Evidence Snippet                                                    |
| ---------- | -------------------------------------------- | ------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------- |
| 2025-08-13 | Browser lock during bulk upload (simulated)  | Rows >100k caused IndexedDB thrash               | Set hard cutoff at 50,000; checkpoint/resume added | “Bulk uploads exceeding this caused browser instability.”           |
| 2025-08-14 | Patron email validation failure (model test) | Missing values caused form crashes               | Instituted **“n/a” normalization rule**            | “n/a normalization rule established.”                               |
| 2025-08-15 | Excessive API throttling failures (test)     | Burst PubMed requests >3/sec                     | Imposed ≤2/sec throttle globally                   | “Rate limit capped at ≤2/sec PubMed API calls.”                     |
| 2025-08-21 | Missing packaging artifacts in ZIP           | No monolith, no SW, no PDFs in audit             | Gate 0 upload audit enforced                       | “Monolithic HTML: missing; Service Worker: missing; PDFs: missing.” |
| 2025-08-22 | Placeholder and `.xlsx` references detected  | Leftover dev text and forbidden Excel references | Placeholder scrub, `.xlsx` banned                  | “Found 7 placeholders, 2 XLSX references in audit.”                 |

---

## 3. Canonical Updates

| Timestamp  | Canonical Update                                        | Trigger/Context                            | Evidence Snippet                                                        |
| ---------- | ------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| 2025-08-12 | CT.gov enrichment prohibited (linkout-only)             | v2.0 catastrophic CORS failure             | “CT.gov enrichment removed; replaced with NCT linkout-only approach.”   |
| 2025-08-13 | Bulk ops capped at 50,000                               | Browser instability in modeling            | “Bulk cutoff set at 50,000 rows.”                                       |
| 2025-08-13 | ≤2/sec API throttle required                            | PubMed request bursts                      | “Rate limit capped at ≤2/sec PubMed API calls.”                         |
| 2025-08-14 | Checkpoint/resume mandatory                             | Crash recovery modeling                    | “Checkpoint/resume implemented using IndexedDB.”                        |
| 2025-08-15 | “n/a” normalization rule                                | Dirty patron inputs                        | “n/a normalization rule established.”                                   |
| 2025-08-21 | Gate 0 Operational Stability Safety                     | Session degradation + packaging audit gaps | “Gate 0 added: baseline rehydration, placeholder scan, manifest audit.” |
| 2025-08-22 | Packaging requires Gate 0–3 pass, no placeholders/stubs | Audit failures                             | “All packaging must pass Gate 0–3 with no stubs.”                       |

---

## 4. Catastrophic / Systemic Events

| Time/Phase                      | Event                                               | Impact                                         | Action Taken                                    |
| ------------------------------- | --------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| 2025-08-12 (v2.0 startup)       | All modules failed load (0/13)                      | SilentStacks unusable; production demo blocked | Pivoted to v2.1, stripped CT.gov enrichment     |
| 2025-08-21 (Gate 0 enforcement) | Packaging failed audit (missing monolith, SW, PDFs) | Modeling/packaging blocked                     | Enforced Gate 0 audit before packaging proceeds |

---

## 5. Root Cause Analysis

| Time       | Event                           | Cause                    | Corrective Action                  |
| ---------- | ------------------------------- | ------------------------ | ---------------------------------- |
| 2025-08-12 | v2.0 crash                      | CT.gov enrichment (CORS) | Switch to NCT linkout-only         |
| 2025-08-13 | Bulk instability (model)        | Excessive rows >100k     | Cap at 50k; checkpoint/resume      |
| 2025-08-14 | Patron form crashes (model)     | Missing data             | “n/a” normalization                |
| 2025-08-15 | API throttling failures (model) | PubMed bursts            | ≤2/sec throttle                    |
| 2025-08-21 | Packaging gaps                  | Missing artifacts        | Gate 0 audit + mandatory artifacts |

---

## 6. Summary

SilentStacks v2.0 suffered **true production failures**, with CORS crashes and startup collapse caused by CT.gov enrichment attempts. These failures forced the **pivot to v2.1**, which abandoned enrichment entirely in favor of linkout-only workflows.

SilentStacks v2.1 has not failed in production. Instead, it encountered **modeling and packaging failures**: unstable bulk upload tests, placeholder artifacts, missing PDFs, and `.xlsx` references. These surfaced only in audit and build pipelines, not in live use.

As a result, the canon evolved: linkout-only policy, strict 50k bulk cap, API throttling, “n/a” normalization, and mandatory Gate 0–3 checks. Together these changes transformed SilentStacks from a brittle v2.0 production system into a **hardened, compliance-ready v2.1 modeling framework**.

 2. P0 Failures

| Timestamp   | Failure | Root Cause | Corrective Action | Evidence Snippet |
|-------------|---------|------------|-------------------|------------------|
| 2025-08-12  | v2.0 catastrophic failure | CT.gov CORS restrictions blocked enrichment | Removed enrichment; pivot to v2.1 with NCT linkout | "CORS blocked CT.gov enrichment … unrecoverable" |
| 2025-08-12  | Service worker instability | Cache corruption, brittle lifecycle | Simplified SW to cache shell only | "SW instability broke offline caching … corrective: SW simplified" |
| 2025-08-13  | Browser crash on bulk ops | No bulk limits | Enforced ≤50k cap | "Bulk ops unbounded … enforced 50k cutoff" |
| 2025-08-14  | Data loss on network/tab crash | No persistence of bulk jobs | IndexedDB checkpoint/resume added | "Job loss … implemented checkpoint/resume" |
| 2025-08-15  | Dirty rows dropped | Invalid data silently omitted | “n/a” rule enforced; dirty export enabled | "Dirty rows silently dropped … forced 'n/a'" |
| 2025-08-16  | Ambiguous commit semantics | No distinction between clean vs dirty ingestion | Commit Clean vs All added | "Commit logic unclear … toggle added" |
| 2025-08-16  | Exports failed round-trip | Header drift, blank cells | Enforced canonical headers + strict NLM | "Exports not re-import safe … fixed" |
| 2025-08-17  | Accessibility below AAA | Only AA compliance | AAA matrix added; AAA made P0 | "Accessibility below AAA … elevated AAA" |
| 2025-08-18  | Header schema drift | Docs and exports inconsistent | Locked canonical headers | "Header drift … canonicalized headers" |
| 2025-08-19  | Worst-case scenarios non-canonical | Spec drifted; lost in modeling | Dedicated doc + Playbook linkage | "Worst-case scenarios … made canonical" |
| 2025-08-20  | Docs drift (Playbook vs GAP) | GAP and Playbook out of sync | GAP embedded in Playbook | "Docs drift … unified Playbook" |
| Various     | Lost bulk ops session | Overwritten chat logs | Declared unrecoverable | "Unrecoverable due to deleted chat" |


