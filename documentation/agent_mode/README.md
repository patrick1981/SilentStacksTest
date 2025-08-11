# SilentStacks – Agent Package (Monolithic-first)

This package is ready for Agent Mode. It contains a **canonical spec**, **repeatable playbooks**, **checks**, and a **minimal runnable monolith scaffold** the agent can expand.

## Contents
- `AGENT_TASKS.md` – step-by-step playbooks (Build, Test, Package, A11Y, API contracts, Init order fixes)
- `SILENTSTACKS_SPEC.md` – canonical, living spec for v2.x monolithic build
- `modules.json` – deterministic init graph (for later modularization)
- `templates/module.json` – per-module manifest template
- `CHECKS.yml` – must-pass checks (syntax, API, a11y AAA, offline, smoke boot)
- `RELEASE_NOTES_TEMPLATE.md`, `CHANGELOG.md`, `GAP_REPORT.md`
- `tests/spec-matrix.json` – traceability map
- `scaffold/monolith/index.html` – minimal accessible monolith with tabs + placeholders
- `scaffold/monolith/service-worker.js` – offline cache scaffold

## Quick start (paste to your agent)
**Task:** Use this package to produce a meeting-ready **monolithic HTML** and a zipped release with reports.

**Steps for agent:**
1. Read `SILENTSTACKS_SPEC.md` and follow it as the source of truth.
2. Run **Build & Test** playbook from `AGENT_TASKS.md`.
3. Expand `scaffold/monolith/index.html` into a full build (all features), keep WCAG 2.2 AAA.
4. Run checks from `CHECKS.yml`; update `GAP_REPORT.md` and `CHANGELOG.md`.
5. Output `dist/SilentStacks_monolith.html`, reports, and `SilentStacks_Release.zip`.
