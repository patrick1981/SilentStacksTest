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
- Bulk PMID paste/upload enriches same as Add form: ☐ Verified
- Blanks ignored; PMIDs validated; CT.gov only when NCT present: ☐ Verified
- Bulk urgency/status updates apply to selected records: ☐ Verified
- DOCLINE uniqueness enforced (single + bulk): ☐ Verified
- Column headings (exact): `Urgency | DOCLINE Number | Citation | Patron E-mail | Status | Date Stamp`: ☐ Verified

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

## Documentation & Code Quality
- QuickStart / TechMaintenance / DevelopersGuide updated: ☐ Yes / ☐ No
- “What changed in this build” appended (dated): ☐ Yes / ☐ No
- JSDoc coverage for exported functions: ☐ OK / ☐ Missing
