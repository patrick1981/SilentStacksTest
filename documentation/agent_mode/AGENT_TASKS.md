# Agent Tasks (Playbooks)

> Follow steps deterministically; pause for approval before overwriting artifacts.

## Playbook: Build & Test (Monolithic)
1. Load working directory; ingest `SILENTSTACKS_SPEC.md` and `CHECKS.yml`.
2. Validate that the scaffold boots with no uncaught errors.
3. Implement/upgrade features per spec, prioritizing: Bulk Paste/Upload, Enrichment, Cross-population, Tabs, Export, A11Y AAA, Offline.
4. Run Syntax/Lint; then execute API Contract tests (mocked → live).
5. Run Accessibility audit (AAA) per the Accessibility playbook.
6. Verify Offline: service worker caches assets; monolith loads with network disabled.
7. Update `CHANGELOG.md` and `GAP_REPORT.md`.
8. Package artifacts in `dist/` and create `SilentStacks_Release.zip` with `RELEASE_NOTES.md`.

## Playbook: API Contracts
1. Support seeds: PMID, DOI, NCT (and mixed).
2. PubMed: title, authors, journal, year, volume/issue/pages, abstract, MeSH (≤5), DOI.
3. CrossRef: DOI → bibliographic augmentation.
4. ClinicalTrials.gov: NCT → trial title/status/dates; detect NCT in abstracts.
5. Enforce rate limits; cache; capture conflicts into `sourceConflicts`.

## Playbook: Accessibility (WCAG 2.2 AAA)
1. Themes: Landio Light / Landio Dark / Landio High Contrast. Keyboard-toggle; persist choice.
2. Labels for all form fields; 7:1 contrast; visible focus; no traps; skip links; logical tab order.
3. Manual keyboard-only pass on flows: Bulk Paste → Enrich → Export.

## Playbook: Release Packaging
1. Emit `dist/SilentStacks_monolith.html` and attach audit reports.
2. Fill `RELEASE_NOTES.md` from template, include check results.
3. Zip as `SilentStacks_Release.zip`.

## Playbook: Init/Registry (for later modularization)
1. Use `modules.json` as the DAG; ensure each module registers exactly once and is idempotent.
2. Capture boot trace `loaded → registered → initialized` for all modules.
