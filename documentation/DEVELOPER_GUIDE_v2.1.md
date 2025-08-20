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
