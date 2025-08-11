
---

# Gap Report (drop-in template)

**Save as:** `GAP_REPORT.md` (the agent should update this every run)

```markdown
# GAP REPORT — SilentStacks v2.0

**Run date:** <!-- agent fills -->
**Commit/Build:** <!-- agent fills -->

## Summary
- ✅ Completed this run:
  - <!-- feature bullets -->
- ⚠️ Partial:
  - <!-- bullets with notes -->
- ❌ Missing:
  - <!-- bullets with owner/date -->

## Failing/Skipped Acceptance Tests
- <!-- list test name → reason → next action -->

## UI Contract Compliance
- DOM/CSS diff: <!-- none / summary + link to diff -->
- Screenshots attached: Dashboard / Add / All / Import-Export / Settings

## Docs & Comments
- QuickStart / TechMaintenance / DevelopersGuide: updated (Y/N)
- JSDoc coverage for exported functions: <!-- % or N/A -->
- “What changed in this build” sections appended (Y/N)

## Risks / Decisions
- <!-- short bullets, links to issues -->


## Baseline Compliance
- DOM diff vs v1.2 reference: ☐ None / ☐ Differences (attach diff)
- CSS selector compatibility (tablist/panels/inputs/buttons): ☐ OK / ☐ Issues
- Screenshots attached (Dashboard/Add/All/Import-Export/Settings): ☐ Yes / ☐ No
- Theme default = Light and opt-in HC/Dark only: ☐ Verified

## Import/Export Rules
- Bulk PMID paste ignores blanks; CT.gov enrichment on NCT present: ☐ Verified
- Table headers (exact order & strings) render correctly:
  Urgency | Docline Number | PMID | Citation | Patron Name | Status  ☐ Yes / ☐ No
- Export blanks as empty strings (CSV) / empty or omitted (JSON): ☐ Verified
