| Category                | v2.0 Failure Mode (Production)                                      | v2.1 Failure Mode (Modeling)                                                         | Notes / Evolution                                                            |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **Development Pattern** | Straight into coding, rapid UI iteration, no systematic gate checks | Gate framework introduced but failed catastrophically                                | v2.1 tried to fix 2.0 chaos with process, but collapsed under its own weight |
| **Metadata Enrichment** | PubMed → DOI broken; PubMed → NCT missing; CT.gov blocked by CORS   | CT.gov linkout-only policy adopted, but PubMed/DOI/NCT enrichment still inconsistent | CORS pivot marked official split between 2.0 and 2.1                         |
| **UI / Data Model**     | Missing NCT fields, MeSH/CT.gov chips absent, table headers wrong   | Chips preview added but not bound to table/cards; table mostly fixed                 | v2.1 improved structure but never fully delivered                            |
| **CRUD Operations**     | Baseline regression: bulk update missing, bulk delete incomplete    | Bulk update still broken; delete restored                                            | CRUD regressions carried forward despite multiple patches                    |
| **Export / Reporting**  | NLM export missing; CSV/JSON partial                                | NLM export wired in recovery builds but docs unsynced                                | Export features improved post-meltdown                                       |
| **Security**            | Weak validation, no API injection prevention                        | Regex validators + encoding added, allow-list still pending                          | Slight hardening but incomplete                                              |
| **Accessibility**       | Only partial AAA (contrast, keyboard traps)                         | Audit abandoned mid-pass during meltdown                                             | Accessibility never stabilized in either version                             |
| **Docs & Playbook**     | Ad hoc GAP reports; Playbook incomplete                             | Playbook + GAP reports expanded but lost sync during meltdown                        | v2.1 meltdown forced Playbook consolidation afterwards                       |
| **Failure Character**   | **Feature collapse**: enrichment ambitions untenable                | **Systemic meltdown**: all gates failed, catastrophic flush, unrecoverable logs      | Defines the pivot: v2.0 = technical failure, v2.1 = governance failure       |


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


### Table X. SilentStacks v2.1 — P0 Failure Incident Chronology (Session: August 22, 2025)

| #  | Date       | Order | Gate / Step           | P0 Failure Event        | Description of What Happened                                         | Canon Clause Violated¹      | Corrective Action Applied²                       |
| -- | ---------- | ----- | --------------------- | ----------------------- | -------------------------------------------------------------------- | --------------------------- | ------------------------------------------------ |
| 1  | 2025-08-22 | T+0   | Wind-Down / Step G    | Inline docs missing     | Playbook, SOP, Continuity, Gate 0 *listed* instead of printed inline | Print=Display (Step G)      | Enforced inline=display; chunked streaming print |
| 2  | 2025-08-22 | T+1   | Wind-Down / Step G    | Stub documents          | Exec Summary / Playbook truncated or stubby                          | Concurrency 100% (no stubs) | Stub scanner required                            |
| 3  | 2025-08-22 | T+2   | Emergency / Packaging | Missing ZIP             | No ZIP surfaced after Emergency shutdown                             | ZIP invariant               | ZIP mandatory at Gate 0                          |
| 4  | 2025-08-22 | T+2   | Emergency / Packaging | No ZIP integrity check  | ZIP not checksum-verified or reopened                                | Integrity check             | Checksum + reopen test                           |
| 5  | 2025-08-22 | T+3   | Wind-Down / Final     | Flush skipped           | Flush omitted after incomplete shutdown                              | Flush invariant             | ZIP→Verify→Flush lock enforced                   |
| 6  | 2025-08-22 | T+3   | Logging               | Manual logging required | P0 failures not auto-logged; user had to intervene                   | Auto-log everywhere         | Auto-log enforced                                |
| 7  | 2025-08-22 | T+4   | Repair                | Repair prompts          | User prompted for repair approval                                    | Prompts policy              | Prompts forbidden; notify only                   |
| 8  | 2025-08-22 | T+4   | Concurrency           | Drift allowed           | Docs not cross-checked; drift passed audits                          | Concurrency 100%            | Per-doc concurrency audits required              |
| 9  | 2025-08-22 | T+5   | Audit                 | Stub approved           | Stubs passed Gate 2 audit                                            | Gate 2 audit                | Stub scanner required                            |
| 10 | 2025-08-22 | T+5   | Spin-Up               | No baseline             | Session started without GitHub baseline ZIP                          | Baseline requirement        | Baseline enforced                                |
| 11 | 2025-08-22 | T+6   | Gate 0 / Perf.        | Threshold missed        | Browser >830 MB; no Emergency engaged                                | Watchdog                    | Watchdog tied to Emergency                       |
| 12 | 2025-08-22 | T+6   | Perf. Degrade         | No Wind-Down            | Browser lag not triggering brakes                                    | Degradation triggers        | Degradation auto-Wind-Down                       |
| 13 | 2025-08-22 | T+7   | Alerts                | Silent Emergency        | Emergency engaged without alerts                                     | Alerts canon                | Alerts required                                  |
| 14 | 2025-08-22 | T+7   | RCA                   | Missing RCAs            | Failures lacked RCA entries                                          | RCA canon                   | Auto-RCA logging mandated                        |
| 15 | 2025-08-22 | T+8   | Auto-Repair Loop      | Infinite loop risk      | No cap/timeout on repair loop                                        | Repair loop canon           | Cap = 10 iters / 5 min                           |
| 16 | 2025-08-22 | T+8   | Wind-Down             | Approval logic          | Assumed user present; no timeout fallback                            | Approval canon              | Timeout → auto-approve                           |
| 17 | 2025-08-22 | T+9   | Network Ops           | Fetches unhandled       | PubMed/CrossRef not aborted                                          | Task registry canon         | Abort non-critical; finish critical              |
| 18 | 2025-08-22 | T+9   | Packaging             | Partial scope           | ZIP sometimes majors-only                                            | Packaging canon             | All docs included                                |
| 19 | 2025-08-22 | T+10  | Audit                 | False XLSX detection    | CSV audit raised XLSX error                                          | CSV-only canon              | Regex corrected                                  |
| 20 | 2025-08-22 | T+11  | All Gates             | Catastrophic failure    | Emergency ZIP not created + Flush skipped                            | All gates canon             | Canon Lock enforced; rebuild required            |

---

¹ *Canon Clauses:*

* Print=Display (Step G)
* Concurrency 100%
* ZIP invariant
* Integrity check
* Flush invariant
* Auto-log everywhere
* Prompts policy
* Gate 2 audit
* Baseline requirement
* Watchdog (825 MB)
* Degradation triggers
* Alerts canon
* RCA canon
* Repair loop canon
* Approval canon
* Task registry canon
* Packaging canon
* CSV-only canon
* All gates canon

² *Corrective actions* were applied during this session; outstanding fixes include stub scanner implementation, per-doc concurrency audits, and mandatory baseline ZIP enforcement.

---

📌 This format is **paper-ready**: you can drop it as *Table X* in your Methods/Results section, then refer to it in text (“see Table X for full chronology of P0 failures”).

Do you want me to also generate a **LaTeX version** of this table for direct copy-paste into your manuscript?
