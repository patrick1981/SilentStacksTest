# SilentStacks Failure Records (Session Extraction)

---

## 1. Major Decisions Made

- **2025-08-12** — Pivot to v2.1 after catastrophic v2.0 failure (CORS + SW instability).  
- **2025-08-12** — CT.gov enrichment removed; replaced with NCT linkout-only.  
- **2025-08-13** — Bulk cutoff set at 50,000 rows.  
- **2025-08-13** — PubMed API calls throttled at ≤2/sec.  
- **2025-08-14** — Checkpoint/resume via IndexedDB implemented.  
- **2025-08-15** — “n/a” normalization rule enforced for missing values.  
- **2025-08-16** — Commit Clean vs Commit All options created.  
- **2025-08-16** — Exports made round-trip safe (CSV/Excel).  
- **2025-08-17** — Accessibility AAA compliance elevated to P0.  
- **2025-08-18** — Canonical headers locked: Priority | Docline | PMID | Citation | NCT Link | Patron Email | Fill Status.  
- **2025-08-19** — Worst-case scenarios library (40 cases) made canonical.  
- **2025-08-20** — Playbook unified with embedded GAP Report.  
- **2025-08-21** — Peer-review article + conference case study outputs mandated.  

---

## 2. P0 Failures

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

---

## 3. Canonical Updates

| Timestamp   | Canonical Update | Trigger/Context | Evidence Snippet |
|-------------|-----------------|-----------------|------------------|
| 2025-08-12  | Playbook v2.1 drafted | v2.0 collapse | "Created Playbook v2.1 draft" |
| 2025-08-13  | Bulk cutoff + rate limit codified | Browser crashes, API block | "Added cutoff (50k) + ≤2/sec rules" |
| 2025-08-14  | IndexedDB checkpoint/resume | Job loss mid-run | "Checkpoint/resume added" |
| 2025-08-15  | “n/a” rule + dirty export | Data integrity issues | "Dirty-row export documented" |
| 2025-08-16  | Commit Clean/All + round-trip export | Librarian workflow gap | "Commit Clean vs All added" |
| 2025-08-17  | AAA accessibility matrix | Risk of non-adoption | "AAA matrix inserted" |
| 2025-08-18  | Canonical headers declared | Prevent drift | "Canonical headers declared" |
| 2025-08-19  | Worst-case doc created | Prevent spec drift | "Worst-case scenarios doc created" |
| 2025-08-20  | GAP embedded in Playbook | Docs drift | "Embedded GAP into Playbook" |
| 2025-08-21  | Publication outputs mandated | Leadership/comm needs | "Peer-review article + case study" |

---

## 4. Catastrophic / Systemic Events

| Time/Phase | Event | Impact | Action Taken |
|------------|-------|--------|--------------|
| 2025-08-12 (v2.0) | Catastrophic failure (CORS + SW) | Enrichment broke; unrecoverable | Pivoted to v2.1; archived v2.0 |
| 2025-08-19 | Modeling drift caused P0 header loss | Concurrency lost across sessions | Rebuilt canonical baseline ops doc; locked headers |

---

## 5. Root Cause Analysis

| Time | Event | Cause | Corrective Action |
|------|-------|-------|-------------------|
| 2025-08-12 | v2.0 failure | CT.gov CORS, SW instability | Pivot, remove enrichment, simplify SW |
| 2025-08-13 | Bulk crashes | No cutoff | Added ≤50k cutoff |
| 2025-08-14 | Data loss mid-job | No persistence | Added checkpoint/resume |
| 2025-08-15 | Dirty data lost | Dropped invalids | Enforced “n/a”, export dirty-only |
| 2025-08-18 | Header drift | Docs unsynced | Canonical headers locked |
| 2025-08-19 | Lost bulk ops chat | Overwrite during retry | Declared unrecoverable; created dedicated doc |

---

## 6. Summary

SilentStacks v2.0 collapsed in production due to **CT.gov CORS failures** and brittle service worker caching. This forced a **pivot to v2.1**, with enrichment stripped back to stable PubMed/CrossRef and NCT linkouts only.  
P0 failures included browser crashes during unbounded bulk ops, silent data loss on network failure, and schema drift across exports. These were corrected with **strict cutoffs, checkpoint/resume, mandatory “n/a” fillers, canonical headers, and commit toggles**. Accessibility was elevated to P0 with WCAG 2.2 AAA compliance matrices embedded.  

The transition from v2.0 → v2.1 reflects a shift from optimistic assumptions (clean data, stable APIs) to **failure-first engineering** (dirty data, extreme bulk, network volatility). Outcomes: a hardened client-side system, resilient under messy clinical inputs, demo-stable with AAA accessibility, and governed by a unified Playbook with embedded GAP Report.  
