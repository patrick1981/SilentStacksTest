# SilentStacks – System Model (v2.1)

## Actors
- Librarian/Staff: captures requests; resolves dirty rows.
- SilentStacks App (client-only): validates → enriches → stores → renders.
- External APIs: PubMed, CrossRef, ClinicalTrials.gov.
- PM/Leadership: reviews acceptance + GAP reports.

## Data Flow
Input (Form/CSV/Paste)
 → Validate (headers + identifiers)
 → Bulk Engine (queue + throttle + retry)
 → API Enrichment (PubMed/CrossRef/NCT)
 → Merge/Reconcile (mismatch flags)
 → Store (IndexedDB; prefs in localStorage)
 → Render (table + card, AAA)
 → Export/Reports (CSV/JSON/print; session summary)

## Error/Recovery Paths (P0)
- Network loss: checkpoint + resume
- Over-limit: reject >50k/job
- API throttle: ≤2/sec PubMed; backoff/429
- Dirty data: isolate/review/export‑dirty
