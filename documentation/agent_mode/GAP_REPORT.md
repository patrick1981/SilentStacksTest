# GAP REPORT — SilentStacks v2.0

**Run date:** <!-- fill -->
**Commit/Build:** <!-- fill -->

## Summary
- ✅ Completed: <!-- list -->
- ⚠️ Partial: <!-- list -->
- ❌ Missing: <!-- list -->

## Observed Failures vs Expected
- PMID lookup → NCT not populated.
- No field for NCT Title.
- No MeSH headings displaying as selectable tags.

## Baseline Compliance
- DOM diff: ☐ None / ☐ Differences.
- CSS selector check: ☐ OK / ☐ Issues.
- Screenshots: ☐ Yes / ☐ No.
- Theme default Light: ☐ Verified.

## Import/Export
- Bulk paste ignores blanks; enriches with PubMed; CT.gov on NCT: ☐ Verified.
- Table headers exact: ☐ Yes / ☐ No.
- Exports blanks as empty strings: ☐ Verified.

## Security
- Input sanitization: ☐ OK / ☐ Missing.
- Output escaping: ☐ OK / ☐ Missing.
- API injection prevention: ☐ OK / ☐ Missing.

## Docs
- All updated: ☐ Yes / ☐ No.
- "What changed" sections: ☐ Yes / ☐ No.
- JSDoc coverage: ☐ OK / ☐ Missing.

## Baseline Regressions
- CRUD operations (edit single, bulk update/delete): **Fail** — non-functional in current build (regression from v1.2).
