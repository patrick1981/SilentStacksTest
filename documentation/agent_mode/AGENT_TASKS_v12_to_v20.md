# Agent Playbook: Preserve v1.2 UI, Implement v2.0 Features

**Source of truth for UI:** [https://patrick1981.github.io/SilentStacks/](https://patrick1981.github.io/SilentStacks/)
**Reference bundle:** `SilentStacks_v1.2_UI_Reference.zip` (index.html, style.css, app.js, offline-manager.js, fuse.min.js, papaparse.min.js)

## 0) Non-Negotiable Constraints (UI Contract)

* No frameworks added (no Bootstrap/Tailwind/CDNs).
* Do not change existing IDs, classes, or ARIA roles; no tab markup changes.
* All new behavior must be added via adapter modules or data attributes, not by restructuring HTML.
* Missing files (e.g., documentation.js) must be stubbed with a no-op module.
* Any DOM change requires a before/after screenshot and explicit approval.

## 1) Phased Roadmap (v1.2 → v2.0)

**Phase A — Hardening & Parity**

1. Add service worker + cache manifest for offline.
2. Add error boundary/notifications area.
3. Implement exporters (JSON/CSV/NLM) behind existing Export buttons.
4. Add tests: no uncaught errors on boot; keyboard traversal across all tabs.

**Phase B — Enrichment & Cross-Population**

1. Add API clients with rate limits.
2. Implement Bulk Paste / Bulk Upload normalization for mixed IDs.
3. Cross-populate identifiers and merge sources.
4. MeSH auto-tagging (max 5) added to existing tag UI.

**Phase C — Accessibility (WCAG 2.2 AAA)**

1. Add theme toggle (Light/Dark/HC) in settings.
2. Ensure labels, name/role/value, 7:1 contrast, skip links, visible focus.
3. Keyboard-only passes for major flows.

**Phase D — Offline-First Behaviors**

1. Queue failed lookups/exports while offline.
2. Verify offline load after initial visit; add cache integrity check.

**Phase E — Search/Filter Upgrades**

1. Keep Fuse.js; add fielded search and ranking.
2. Preserve table; add sorting & filtering without changing columns.

## 2) Data & API Mapping

* Record includes core bibliographic fields, MeSH, tags, status, priority, notes, and provenance.
* NLM export adheres to NLM journal abbreviations when available.
* Retries with exponential backoff, 30s timeouts, error notifications.

## 3) Code Organization

* `assets/js/adapters/ui-bridge.js` — binds to existing DOM elements.
* `assets/js/api/clients.js` — API fetch functions with rate limiting.
* `assets/js/enrichment/pipeline.js` — normalization and enrichment pipeline.
* `assets/js/exporters/` — output functions for JSON, CSV, NLM.
* `assets/js/offline/sw.js` — service worker logic.

## 4) Acceptance Criteria

* Zero uncaught errors during core flows.
* Pixel-stable layout.
* A11Y AAA checks pass.
* Offline load verified.
* Exports produce valid outputs.
* Cross-population works as intended.

## 5) Test Matrix

* Boot, Lookup, Bulk, Enrichment, Search, Export, Offline, A11Y.

## 6) Deliverables

* Updated v1.2 HTML (unchanged DOM), new JS files under assets/js.
* service-worker.js + registration.
* CHANGELOG.md and GAP\_REPORT.md updates.
* Monolithic HTML build with inlined assets.

## 7) Guardrails

* Provide diff and screenshots for any changes.
* Propose minimal options for DOM changes with mockups; pause for approval.
## Documentation & Code Quality (must-do each run)
1. Ensure docs exist and are current: 
   - `documentation/QuickStart.md`
   - `documentation/TechMaintenance.md`
   - `documentation/DevelopersGuide.md`
2. Append a **“What changed in this build”** section to all three with a concise delta.
3. Update links to docs in `RELEASE_NOTES.md`; bump `CHANGELOG.md`.
4. Enforce comments:
   - JSDoc for all exported/public functions.
   - Rationale comments above non-obvious blocks (rate limits, merge, queue).
5. Fail the run if:
   - Docs missing or not updated.
   - Public functions lack JSDoc.

