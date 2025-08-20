Got it — here’s the **Developer Guide v2.1**, fully expanded for handoff. This one assumes a developer (human or AI) needs to pick up SilentStacks, understand the moving parts, and extend/debug with minimal overhead.

---

# 👨‍💻 SilentStacks Developer Guide v2.1

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
8. [Testing & Debugging](#testing--debugging)
9. [Deployment & Packaging](#deployment--packaging)
10. [Known Gaps (v2.1)](#known-gaps-v21)

---

## 🏗️ Architecture Overview

SilentStacks is a **client-side, offline-first ILL management app**.
Key constraints:

* No backend → storage and enrichment fully client-side.
* Monolithic HTML build (`dist/SilentStacks_v2_monolith.html`) for field deployment.
* AI-compatible selector map → ensures automated agents can bind without breaking UI.

### Core Components

* **App Controller** (`app.js`) — Main state + enrichment adapter.
* **Offline Manager** (`offline-manager.js`) — Service Worker + API queue (partial).
* **UI Adapter** (`adapter.js`) — Selector map + row/card binding.
* **Styles** (`style.css`) — Theme-aware, AAA-contrast baseline.
* **Docs** (`documentation/`) — Playbook, Gap Report, QuickStart, Upkeep, etc.

### Design Patterns

* **IIFE + Event-driven** — Avoids global namespace collisions.
* **Progressive Enhancement** — Functions without JS, then enriches with JS.
* **Accessible-first** — Keyboard nav, ARIA live regions, contrast tokens.

---

## 📁 File Structure

```
silentstacks/
├── index.html                   # Entry point (monolith in dist/)
├── assets/
│   ├── css/style.css            # Styles, themes
│   ├── js/
│   │   ├── app.js               # Core enrichment + UI logic
│   │   ├── adapter.js           # Selector map + wiring
│   │   ├── offline-manager.js   # Offline + SW
│   │   └── lib/
│   │       ├── papaparse.min.js # Bulk CSV parsing
│   │       └── fuse.min.js      # Search
│   └── fonts/reddit-sans/       # Self-hosted fonts
├── documentation/               # All markdown docs
└── dist/SilentStacks_v2_monolith.html
```

---

## 🔌 Metadata Pipelines

### PMID → PubMed

1. Validate PMID (6–9 digits).
2. ESummary → get title, authors, journal.
3. EFetch → pull DOI + MeSH.
4. Normalize into `UnifiedResult`.

### DOI → CrossRef

1. Validate DOI (regex).
2. Fetch CrossRef JSON.
3. Backfill PMID if available.
4. Normalize → `UnifiedResult`.

### NCT → ClinicalTrials.gov

1. Validate NCT (`NCT\d{8}`).
2. Pull trial metadata (title, sponsor, phase, status).
3. Convert into chips + trial fields.
4. Normalize → `UnifiedResult`.

**Adapter Rule:** Always prefer `UnifiedResult.unified`.

---

## 📦 Bulk Operations

* **Bulk Paste** → parse textarea → tokenize (PMID/DOI/NCT) → dedupe → enrich @2/sec.
* **Bulk Upload** → accept `.txt`, `.csv`, `.json`.

  * TXT → regex extraction.
  * CSV → headings (`pmid`, `doi`, `nct`) or fallback regex.
  * JSON → `{pmids:[],dois:[],ncts:[]}` or array of objects.
* **Commit Options:**

  * *Commit Clean* → only validated rows.
  * *Commit All* → all rows, dirty flagged.
* **Worst-case handling:** 50k cutoff, export dirty rows, resume checkpoint.

---

## 🌐 Offline & Persistence

* **IndexedDB** → all request rows persisted locally.
* **localStorage** → settings + UI state.
* **Service Worker** → caches app shell, queues API calls (gap: sync unstable).
* **Recovery** → on reconnect, flush queue, re-run API calls.

---

## 🎨 Accessibility & Theming

* WCAG 2.2 AAA baseline.
* Theme tokens (`light`, `dark`, `high-contrast`).
* ARIA usage:

  * `aria-live="polite"` for enrichment status.
  * Chips → `role="button"`, keyboard focusable.
* Keyboard-only nav validated (gap: chips still partial).

---

## 🔒 Security & Validation

* **Input validation**: PMID/DOI/NCT regexes.
* **Output sanitization**: Escape HTML + scripts.
* **API requests**: URL encoding enforced.
* **Storage cleaning**: All values passed through sanitizers before IndexedDB.
* **Error log**: Rotating 50-entry local log.

---

## 🧪 Testing & Debugging

### Manual QA Checklist

* [ ] Single PMID lookup populates DOI, NCT, MeSH.
* [ ] DOI lookup backfills PMID.
* [ ] NCT lookup populates phase/sponsor/status.
* [ ] Bulk Paste handles mixed IDs.
* [ ] CSV/JSON uploads parse correctly.
* [ ] Export clean/all works.
* [ ] Offline mode queues API calls, resumes.
* [ ] Accessibility: screen reader, contrast, keyboard nav.

### Debugging Tips

* Use browser console:

  ```js
  console.log('UnifiedResult:', result);
  ```
* Check IndexedDB contents via DevTools > Application.
* Run Lighthouse (Accessibility + PWA audits).

---

## 🚀 Deployment & Packaging

* **Static hosting only** (GitHub Pages, file server, thumb drive).
* **HTTPS required** for SW.
* **Self-contained monolith** build → `dist/`.
* Packaging includes:

  * Monolith HTML
  * Docs (`documentation/`)
  * Readme + license

---

## ❗ Known Gaps (v2.1)

* MeSH chips not wired into cards/table.
* NCT tags incomplete in row rendering.
* Bulk update/delete workflow unbound.
* Service Worker background sync buggy.
* Accessibility AAA → chip ARIA roles, contrast audit pending.
* Security pass 3 (final injection/XSS check) pending.

---

**Bottom line:** Developers should treat v2.1 as a **demo-stable baseline**.
Next steps: close the gaps above, re-run gap report, and cut v2.1 production branch.

---

👉 Do you want me to regenerate the **Executive Summary v2.1** next (for stakeholders), or the **Feature List v2.1** (side-by-side with 2.0 for comparison)?
