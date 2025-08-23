# GAP REPORT — SilentStacks v2.0

**Run date:** <!-- agent fills -->
**Commit/Build:** <!-- agent fills -->

## Summary
- ✅ Completed:
  - <!-- feature bullets -->
- ⚠️ Partial:
  - <!-- bullets -->
- ❌ Missing:
  - <!-- bullets -->

## Failing/Skipped Acceptance Tests
- <!-- test name → reason → next action -->

## Baseline & UI Contract
- DOM diff vs v1.2: ☐ None / ☐ Differences (attach diff)
- CSS selector compatibility (tablist/panels/inputs/buttons): ☐ OK / ☐ Issues
- Screenshots attached (Dashboard/Add/All/Import-Export/Settings): ☐ Yes / ☐ No
- Theme default Light; Dark/HC opt-in only: ☐ Verified
- No DOM/CSS drift: ☐ Verified

## Metadata Enrichment & Form Behavior
- PMID enrichment populates core metadata from PubMed: ☐ Verified
- Major/Minor MeSH headings rendered as selectable chips (correct colors): ☐ Verified
- User-created tags accepted (neutral gray border, light yellow): ☐ Verified
- NCT detection & ClinicalTrials.gov enrichment with abstract + color-coded status chip: ☐ Verified
- PMIDs required for enrichment: ☐ Verified
- On Save: citation stored in NLM format; MeSH & tags preserved: ☐ Verified

## Bulk Operations
- Rich CSV/JSON import maps known headings and preserves extras: ☐ Verified  
- Rich import triggers enrichment when PMID present; falls back to DOI/NCT: ☐ Verified  
- Minimal import accepts headerless PMIDs (paste/CSV) and enriches automatically: ☐ Verified  
- Invalid/empty tokens ignored; no blank records: ☐ Verified  
- Merge does not overwrite non-blank with blanks: ☐ Verified

## Post-Import Workflow
- User can filter to newly imported items and bulk update urgency/status: ☐ Verified  
- Bulk updates apply to selected rows; aria-live confirms: ☐ Verified  
- User can open individual items to fill missing fields; uniqueness enforced: ☐ Verified  
- Filters/sorts consistent in table & cards; selection persists when toggling views: ☐ Verified

## Search/Filter/Sort
- All fields sortable; sorting stable: ☐ Verified
- All fields filterable in table & cards; active filters reflected as chips: ☐ Verified

## Accessibility (WCAG 2.2 AAA)
- Theme toggle functional; Light default: ☐ Verified
- 7:1 contrast; visible focus; skip links; keyboard traversal: ☐ Verified

## Offline-First
- Service worker caches app after first visit: ☐ Verified
- Offline queue for lookups/exports works; retries on reconnect: ☐ Verified

## Import/Export
- JSON, CSV, NLM export works; blanks as empty strings (CSV) or omitted/empty (JSON): ☐ Verified

## Bugs / Shortcomings from Previous Run (must be resolved)
- Add Request form shows NCT content & CT.gov enrichment when PMID has NCT: ☐ Verified  
- Imported items with NCT enriched with CT.gov data: ☐ Verified  
- Table View button displays content with current dataset and filters: ☐ Verified  
- MeSH major/minor headings appear as selectable/taggable chips: ☐ Verified

## Documentation & Code Quality
- QuickStart / TechMaintenance / DevelopersGuide updated: ☐ Yes / ☐ No
- “What changed in this build” appended (dated): ☐ Yes / ☐ No
- JSDoc coverage for exported functions: ☐ OK / ☐ Missing
