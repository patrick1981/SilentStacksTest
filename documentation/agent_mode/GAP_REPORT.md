
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
