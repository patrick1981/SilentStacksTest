# Developers Guide (v2.5)
**UI contract:** v1.2 HTML/CSS are read-only. Extend via JS only.

## Architecture
- **Adapters:** `assets/js/adapters/ui-bridge.js`
- **APIs:** `assets/js/api/clients.js` (PubMed/CrossRef/CT)
- **Pipeline:** `assets/js/enrichment/pipeline.js`
- **Exporters:** `assets/js/exporters/*` (JSON/CSV/NLM)
- **Offline:** `assets/js/offline/sw.js` + queue
- **Search:** fuzzy + fielded, binds to existing table/inputs

## Conventions
- JSDoc for all exported functions.
- Comments explain “why”, not just “what”, especially around rate-limits/merge rules.
- Conventional Commits.

## Release
- Build: `SilentStacks_v2.5_monolith.html`
- Run checks; update `CHANGELOG.md`, `RELEASE_NOTES.md`
- Update “What changed in this build” sections across docs.

## What changed in this build
- (Agent appends notes here automatically)
