
| Date (UTC) | Decision                                        | Rationale                                                              | Outcome                                                                         |         |      |          |          |              |               |
| ---------- | ----------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------- | ---- | -------- | -------- | ------------ | ------------- |
| 2025-08-12 | **Pivot to v2.1**                               | v2.0 failed (CORS, SW instability).                                    | New branch v2.1 created; v2.0 archived.                                         |         |      |          |          |              |               |
| 2025-08-12 | **CT.gov enrichment removed; linkout only**     | CORS instability made API unsafe; public proxies rejected as insecure. | NCTs rendered as direct `https://clinicaltrials.gov/study/<id>` links.          |         |      |          |          |              |               |
| 2025-08-13 | **Bulk cutoff: 50,000 rows**                    | Prevent browser crashes & API abuse.                                   | Hard limit enforced; >50k rejected with clear error.                            |         |      |          |          |              |               |
| 2025-08-13 | **Rate limit ≤2/sec PubMed**                    | Align with NCBI guidance; prevent blocking.                            | Queue + throttle implemented.                                                   |         |      |          |          |              |               |
| 2025-08-14 | **Checkpoint/resume**                           | Prevent loss on crash/network loss.                                    | IndexedDB persists progress; jobs resume.                                       |         |      |          |          |              |               |
| 2025-08-15 | **Dirty rows must never be dropped**            | Real-world “dirty” librarian data.                                     | Highlight dirty; mark fields `"n/a"`; provide Dirty Export.                     |         |      |          |          |              |               |
| 2025-08-16 | **Commit Clean vs Commit All**                  | Librarian choice on ingestion.                                         | Both modes available; dirty flagged in All.                                     |         |      |          |          |              |               |
| 2025-08-16 | **Exports round-trip safe**                     | CSV re-import is essential for librarian workflows.                    | Enforced NLM citations, `"n/a"` rule, canonical headers.                        |         |      |          |          |              |               |
| 2025-08-17 | **Accessibility AAA = P0**                      | Prevent adoption failure, align with WCAG 2.2.                         | 7:1 contrast, ARIA roles, keyboard nav, skip links.                             |         |      |          |          |              |               |
| 2025-08-18 | **Canonical headers locked**                    | Prevent schema drift.                                                  | “Priority                                                                       | Docline | PMID | Citation | NCT Link | Patron Email | Fill Status”. |
| 2025-08-19 | **Worst-case scenarios elevated to canonical**  | Real-world testing priority.                                           | 40-case doc created; explicit mini-specs (Trigger/UI/Storage/Workflow/Logging). |         |      |          |          |              |               |
| 2025-08-20 | **Playbook unified with GAP Report**            | Docs were drifting.                                                    | GAP embedded in Playbook; canonicalized with TOC.                               |         |      |          |          |              |               |
| 2025-08-21 | **Conference + peer-reviewed outputs required** | Leadership/comms deliverable.                                          | Drafts created: conference case study + peer-review article.                    |         |      |          |          |              |               |



| Date       | Canonical Update                                              | File(s)                                                       |
| ---------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| 2025-08-12 | Created **Playbook v2.1** draft; pivot baseline declared.     | `Playbook_v2.1.md`                                            |
| 2025-08-13 | Added bulk cutoff (50k) + rate limit rules.                   | Playbook, GAP Report                                          |
| 2025-08-14 | IndexedDB checkpoint/resume added to baseline.                | Playbook                                                      |
| 2025-08-15 | `"n/a"` rule, dirty-row export documented.                    | Playbook, Dev Guide                                           |
| 2025-08-16 | Commit Clean vs All + round-trip export added.                | Playbook, GAP Report                                          |
| 2025-08-17 | Accessibility AAA matrix inserted.                            | Playbook, GAP Report                                          |
| 2025-08-18 | Canonical headers declared.                                   | Playbook, Baseline Ops doc                                    |
| 2025-08-19 | Worst-case scenarios doc (40 cases) created; Playbook linked. | `Worst_Case_Scenarios.md`                                     |
| 2025-08-20 | GAP Report embedded in Playbook.                              | `Playbook_v2.1.md`                                            |
| 2025-08-21 | Peer-review article + case study prepared.                    | `Conference_Case_Study_v2.1.md`, `PeerReview_Article_v2.1.md` |
