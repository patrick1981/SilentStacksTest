| Date       | P0 Failure                                                    | Impact                                | Corrective Action                                            |
| ---------- | ------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| 2025-08-12 | v2.0 catastrophic failure: **CORS blocked CT.gov enrichment** | API broke; system non-functional.     | Removed CT.gov enrichment; pivoted to NCT linkout.           |
| 2025-08-12 | **Service Worker instability**                                | Offline unreliable; cache corruption. | SW simplified to cache shell only; background sync deferred. |
| 2025-08-13 | **Bulk ops unbounded**                                        | Browser crash risk.                   | Enforced ≤50k cutoff; queue + throttle.                      |
| 2025-08-14 | **Job loss on crash/network**                                 | Librarian work lost.                  | Implemented IndexedDB checkpoint/resume.                     |
| 2025-08-15 | **Dirty rows silently dropped**                               | Data integrity risk; lost requests.   | Forced `"n/a"` fillers; dirty rows highlighted; export path. |
| 2025-08-16 | **Commit logic unclear**                                      | Ambiguity in librarian workflows.     | Added Commit Clean / Commit All toggle.                      |
| 2025-08-16 | **Exports not re-import safe**                                | Round-trip failures.                  | Enforced canonical headers + `"n/a"` + strict NLM format.    |
| 2025-08-17 | **Accessibility below AAA**                                   | Risk of non-adoption.                 | Elevated AAA to P0; Playbook matrix tracks compliance.       |
| 2025-08-18 | **Header drift**                                              | Schema inconsistencies across docs.   | Locked canonical headers + Playbook enforcement.             |
| 2025-08-19 | **Worst-case scenarios non-canonical**                        | Risk of regression.                   | Created dedicated Worst-Case doc + Playbook linkage.         |
| 2025-08-20 | **Docs drift (Playbook vs GAP)**                              | Mismatched governance.                | Unified Playbook; embedded GAP with live TOC.                |

---

| #  | Date       | Order (approx.)       | Gate / Step           | P0 Failure Event            | What Happened                                                        | Status / Corrective Action              |
| -- | ---------- | --------------------- | --------------------- | --------------------------- | -------------------------------------------------------------------- | --------------------------------------- |
| 1  | 2025-08-22 | T+0 (session start)   | Wind-Down / Step G    | Inline docs missing         | Playbook, SOP, Continuity, Gate 0 *listed* instead of printed inline | ✅ Canon enforced: inline = display      |
| 2  | 2025-08-22 | T+1                   | Wind-Down / Step G    | Stub documents              | Exec Summary / Playbook truncated                                    | ⏳ Stub scanner required                 |
| 3  | 2025-08-22 | T+2                   | Emergency / Packaging | Missing ZIP                 | No ZIP surfaced after Emergency shutdown                             | ✅ ZIP invariant enforced                |
| 4  | 2025-08-22 | T+2                   | Emergency / Packaging | No ZIP integrity check      | ZIP not verified for checksum/open                                   | ✅ Checksum + reopen test                |
| 5  | 2025-08-22 | T+3                   | Wind-Down / Final     | Flush skipped               | Flush omitted after incomplete shutdown                              | ✅ Canon: ZIP → Verify → Flush           |
| 6  | 2025-08-22 | T+3                   | Logging               | Manual logging required     | Failures not auto-logged                                             | ✅ Auto-log mandated                     |
| 7  | 2025-08-22 | T+4                   | Repair                | Repair prompts              | User asked to approve repairs                                        | ✅ Prompts forbidden                     |
| 8  | 2025-08-22 | T+4                   | Concurrency           | Drift allowed               | Docs not cross-checked; drift passed                                 | ⏳ Per-doc concurrency audits required   |
| 9  | 2025-08-22 | T+5                   | Audit                 | Stub approved               | Stubs passed Gate 2 audit                                            | ⏳ Stub scanner required                 |
| 10 | 2025-08-22 | T+5                   | Spin-Up               | No baseline                 | Session started without GitHub ZIP baseline                          | ⏳ Baseline rule added                   |
| 11 | 2025-08-22 | T+6                   | Gate 0 / Perf.        | Threshold missed            | Browser >830 MB; no Emergency triggered                              | ✅ Watchdog bound at 825 MB              |
| 12 | 2025-08-22 | T+6                   | Perf. Degrade         | No Wind-Down                | Lag ignored; brakes not engaged                                      | ✅ Degradation auto-triggers Wind-Down   |
| 13 | 2025-08-22 | T+7                   | Alerts                | Silent Emergency            | Emergency ran without alerts                                         | ✅ Alerts required, prompts forbidden    |
| 14 | 2025-08-22 | T+7                   | RCA                   | Missing RCAs                | Failures lacked RCA entries                                          | ✅ Auto-RCA enforced                     |
| 15 | 2025-08-22 | T+8                   | Auto-Repair Loop      | Infinite loop risk          | No cap or timeout                                                    | ✅ Cap 10 iters/5 min                    |
| 16 | 2025-08-22 | T+8                   | Wind-Down             | Approval logic              | Assumed user presence; no fallback                                   | ✅ Timeout → auto-approve                |
| 17 | 2025-08-22 | T+9                   | Network Ops           | Fetches unhandled           | PubMed/CrossRef not aborted                                          | ✅ Abort non-critical, finish critical   |
| 18 | 2025-08-22 | T+9                   | Packaging             | Partial scope               | ZIP sometimes majors-only                                            | ✅ All docs included                     |
| 19 | 2025-08-22 | T+10                  | Audit                 | False XLSX                  | CSV audit raised false XLSX error                                    | ✅ Regex fixed                           |
| 20 | 2025-08-22 | T+11 (end of session) | All Gates             | Catastrophic system failure | Emergency ZIP not created + Flush skipped = total loss               | ✅ Canon Lock enforced; rebuild required |
