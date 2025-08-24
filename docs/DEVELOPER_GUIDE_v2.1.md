Perfect — thanks for pasting both full texts. I see the situation clearly:

* **Doc 1: "SilentStacks Developer Guide v2.1"** → detailed, human/AI handoff, covering architecture, file structure, pipelines, bulk ops, offline, accessibility, security, testing, deployment, and gaps.
* **Doc 2: "Developer Guide (v2.1)"** → more matrix-driven: WCAG AAA compliance, security conformance, worst-case scenarios, acceptance criteria.

The overlap is strong but the focus differs:
Doc 1 = narrative + architecture.
Doc 2 = checklists + compliance matrices.

Here’s a **single unified Developer Guide v2.1** merging both into one structured master doc:

---

# 👨‍💻 SilentStacks Developer Guide v2.1 (Unified)

**Branch:** v2.1-draft
**Maintainer:** Solo + AI-assisted
**Last Updated:** 2025-08-20

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Metadata Pipelines](#metadata-pipelines)
4. [Bulk Operations](#bulk-operations)
5. [Offline & Persistence](#offline--persistence)
6. [Accessibility & Theming](#accessibility--theming)
7. [Security & Validation](#security--validation)
8. [Compliance Matrices](#compliance-matrices)

   * [WCAG 2.2 AAA](#wcag-22-aaa-conformance-matrix)
   * [Security](#security-conformance-matrix)
9. [Worst-Case Scenarios](#worst-case-scenarios)
10. [Testing & Debugging](#testing--debugging)
11. [Deployment & Packaging](#deployment--packaging)
12. [Known Gaps (v2.1)](#known-gaps-v21)
13. [Acceptance Criteria](#acceptance-criteria)

---

## 🏗️ Architecture Overview

SilentStacks is a **client-side, offline-first ILL management app**.

**Constraints:**

* No backend: all storage and enrichment are client-side.
* Monolithic HTML build (`dist/SilentStacks_v2_monolith.html`) for deployment.
* Selector map ensures AI compatibility with UI.

**Core Components:**

* `app.js` — core enrichment & UI logic
* `offline-manager.js` — service worker & API queue
* `adapter.js` — selector map & wiring
* `style.css` — AAA-compliant theming
* `documentation/` — Playbook, Gap Report, QuickStart, Upkeep, etc.

**Patterns:**

* IIFE + event-driven to avoid namespace collisions.
* Progressive enhancement baseline.
* Accessible-first design (ARIA, keyboard nav, contrast).

---

## 📁 File Structure

```
SilentStacks/
├── index.html
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js
│   │   ├── adapter.js
│   │   ├── offline-manager.js
│   │   └── lib/
│   │       ├── papaparse.min.js
│   │       └── fuse.min.js
│   └── fonts/reddit-sans/
├── documentation/
│   ├── PLAYBOOK_v2.1.md
│   ├── GAP_REPORT_v2.1.md
│   ├── QUICKSTART_v2.1.md
│   ├── UPKEEP_v2.1.md
│   ├── DEVELOPER_GUIDE_v2.1.md
│   ├── COMPLIANCE_APPENDIX.md
│   ├── HANDOFF_GUIDE.md
│   └── Selector_Map_v2.1.md
└── dist/SilentStacks_v2_monolith.html
```

---

## 🔌 Metadata Pipelines

* **PMID → PubMed**: validate → ESummary → EFetch → normalize.
* **DOI → CrossRef**: validate regex → fetch JSON → backfill PMID → normalize.
* **NCT → ClinicalTrials.gov**: validate `NCT\d{8}` → fetch metadata → chips → normalize.

**Rule:** Always prefer `UnifiedResult.unified`.

---

## 📦 Bulk Operations

* **Bulk Paste**: regex → tokenize → dedupe → enrich @2/sec.
* **Bulk Upload**: accept `.txt`, `.csv`, `.json`.
* **Commit Options**:

  * Commit Clean (validated only)
  * Commit All (dirty flagged)
* **Limits**: 50k row cutoff, resume checkpoint.

---

## 🌐 Offline & Persistence

* IndexedDB → request persistence.
* localStorage → settings/UI state.
* Service Worker → caches shell, queues API calls (sync unstable).
* Recovery → checkpoint + resume.

---

## 🎨 Accessibility & Theming

* WCAG 2.2 AAA baseline.
* Tokens for light/dark/high-contrast themes.
* ARIA live regions, keyboard operability.
* Chips = `role="button"`, focusable (gap: partial).

---

## 🔒 Security & Validation

* Regex validation for PMID/DOI/NCT.
* Escape HTML, sanitize attributes.
* URL-encode all API calls.
* Enforce `"n/a"` for missing values.
* Rotating 50-entry local error log.

---

## 📊 Compliance Matrices

### WCAG 2.2 AAA Conformance Matrix

| Criterion               | Level | Status                             |
| ----------------------- | ----- | ---------------------------------- |
| Contrast (Enhanced)     | AAA   | ✅ Met                              |
| Visual Presentation     | AAA   | ⚠ Pending (spacing prefs)          |
| Images of Text          | AAA   | ✅ Met                              |
| Keyboard (No Exception) | AAA   | ✅ Met                              |
| No Timing               | AAA   | ✅ Met                              |
| Three Flashes           | AAA   | ✅ Met                              |
| Location (Breadcrumbs)  | AAA   | ⚠ Pending                          |
| Link Purpose            | AAA   | ✅ Met                              |
| Section Headings        | AAA   | ✅ Met                              |
| Focus Not Obscured      | AAA   | ⚠ Pending                          |
| Focus Appearance        | AAA   | ✅ Met                              |
| Accessible Auth         | AAA   | N/A                                |
| Identify Purpose        | AAA   | ✅ Met                              |
| Consistent Help         | AA    | ⚠ Pending (persistent Help button) |
| Media Alternatives      | AAA   | N/A                                |

### Security Conformance Matrix

| Risk                 | Control               | Status    |
| -------------------- | --------------------- | --------- |
| XSS                  | Escape HTML, sanitize | ✅ Met     |
| API Injection        | Regex + encode        | ✅ Met     |
| CORS Misuse          | Linkout-only CT.gov   | ✅ Met     |
| Data Leakage         | Normalized exports    | ✅ Met     |
| Storage Safety       | IndexedDB cleanup     | ⚠ Pending |
| Dependency Integrity | SRI hash pinning      | ⚠ Pending |

---

## ⚠ Worst-Case Scenarios

* Mixed dirty IDs → parse, queue, flag dirty, `"n/a"`.
* > 50k rows → reject, suggest chunking.
* Network loss / tab close → checkpoint, resume.
* Export/import loops → no corruption, dirty preserved.
* Title-only dumps → fuzzy match, low-score = dirty.
* CSV junk → robust parser + fallback regex.

---

## 🧪 Testing & Debugging

**Manual QA Checklist:**

* PMID lookup populates DOI + MeSH
* DOI backfills PMID
* NCT populates trial data
* Bulk Paste/Upload works
* Clean vs All export works
* Offline queues API calls
* Keyboard nav + screen reader validated

**Debugging Tips:**

* `console.log('UnifiedResult:', result);`
* Check IndexedDB via DevTools.
* Run Lighthouse (PWA + accessibility audits).

---

## 🚀 Deployment & Packaging

* Static hosting only (GitHub Pages, file share, thumb drive).
* HTTPS required for service worker.
* Packaging:

  * Monolith HTML
  * Docs folder
  * Readme + license

---

## ❗ Known Gaps (v2.1)

* MeSH chips not wired into table/cards.
* NCT tags incomplete.
* Bulk update/delete workflow unbound.
* Service Worker background sync buggy.
* Chip ARIA roles & contrast audit pending.
* Final XSS/injection audit pending.

---

## ✅ Acceptance Criteria

* Update GAP Report per PR.
* Verify exports round-trip clean.
* Test all keyboard-only paths.
* Screen reader output verified.

---

👉 That’s the unified **SilentStacks Developer Guide v2.1** — architecture narrative + compliance matrices + worst-case scenarios all in one.

Do you want me to also generate a **formatted PDF** of this for distribution at your department meeting, or keep it strictly Markdown for now?




# SilentStacks Developer Guide v2.1

**Status:** Reference Guide  
**Last Updated:** 2025-08-21  

---

## Table of Contents
1. [Overview](#1-overview)  
2. [Development Principles](#2-development-principles)  
3. [Monolithic Build](#3-monolithic-build)  
4. [Service Worker](#4-service-worker)  
5. [Accessibility](#5-accessibility)  
6. [Handoff & Maintenance](#6-handoff--maintenance)  
7. [References](#7-references)
8. [Documentation Layout](#8-documentation-layout)

Developers must reference and maintain the canonical file structure:

- Playbook → truth source
- Rules Charter → governance rules
- Dev Guide → coding & build standards
- Worst Case Scenarios → failure conditions
- Feature List → feature matrix
- GAP Report → audit baselines
- User Guide → workflows
- Exec Summary → leadership orientation
- Quickstart → setup
- Upkeep → maintenance
- Compliance_User → WCAG traceability


Developers must reference and maintain the canonical file structure:

- Playbook → truth source
- Rules Charter → governance rules
- Dev Guide → coding & build standards
- Worst Case Scenarios → failure conditions
- Feature List → feature matrix
- GAP Report → audit baselines
- User Guide → workflows
- Exec Summary → leadership orientation
- Quickstart → setup
- Upkeep → maintenance
- Compliance_User → WCAG traceability
  

---

## 1. Overview
This guide provides developer-facing instructions for SilentStacks.  
It complements the [Playbook](./Playbook_v2.1.md), [Rules Charter](./RULES_CHARTER.md), and [User Guide](./COMPREHENSIVE_USER_GUIDE_v2.1.md).  

---

## 2. Development Principles
- **Monolithic-first**: Build/test monoliths before modularization.  
- **No placeholders**: All code must be production-ready.  
- **Accessibility**: All commits reviewed against [WCAG 2.2 AAA](https://www.w3.org/TR/WCAG22/).  
- **Cascading updates**: When rules/docs change, cascade into [Playbook](./Playbook_v2.1.md).  

---

## 3. Monolithic Build
- Keep a full monolithic HTML/JS build as the operational baseline.  
- Modularization may occur later but only after monolith stability.  
- Service Worker and IndexedDB integration must be validated in monolith first.  

---

## 4. Service Worker
- Cache-first strategy with network fallback.  
- Background sync for failed requests.  
- Error handling logged into developer console and [GAP report](./GAP_REPORT_v2.1.md).  

---

## 5. Accessibility
- Use semantic HTML, ARIA roles, captions.  
- Test with screen readers (NVDA, JAWS).  
- Verify against [WCAG 2.2 AAA Success Criteria](https://www.w3.org/WAI/WCAG22/quickref/).  
- Maintain a Success Criteria → Feature traceability map in [Selector_Map_v2.1.md](./Selector_Map_v2.1.md).  

---

## 6. Handoff & Maintenance
- All docs and code must be structured for AI + human developers.  
- Provide session summaries and changelogs for continuity.  
- On new dev cycles, review [RULES_CHARTER.md](./RULES_CHARTER.md) before starting.  

---

## 7. References
- [Playbook_v2.1.md](./Playbook_v2.1.md)  
- [RULES_CHARTER.md](./RULES_CHARTER.md)  
- [Selector_Map_v2.1.md](./Selector_Map_v2.1.md)
- [Handoff Guide](./HANDOFF_GUIDE.md)
- [Preservation Checklist](./PRESERVATION_CHECKLIST.md)

---
## 8. Documentation Layout

Developers must reference and maintain the canonical file structure:

- Playbook → truth source
- Rules Charter → governance rules
- Dev Guide → coding & build standards
- Worst Case Scenarios → failure conditions
- Feature List → feature matrix
- GAP Report → audit baselines
- User Guide → workflows
- Exec Summary → leadership orientation
- Quickstart → setup
- Upkeep → maintenance
- Compliance_User → WCAG traceability

