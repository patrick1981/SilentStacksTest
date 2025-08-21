# 📦 SilentStacks v2.1 — P0 Packaging & Stability Suite

## Table of Contents
- [Table of Contents](#table-of-contents)
- [1) Operational Stability Guard (pre-everything)](#1-operational-stability-guard-pre-everything)
- [2) These are **P0 items** and their absence in modeling would indeed cause systemic failure.](#2-these-are-p0-items-and-their-absence-in-modeling-would-indeed-cause-systemic-failure)
- [1. **Project Runtime Model**](#1-project-runtime-model)
- [2. **Canonical Table Headers**](#2-canonical-table-headers)
- [3. **Dirty Data Handling**](#3-dirty-data-handling)
- [4. **Export & Interop Baseline**](#4-export--interop-baseline)
- [5. **Security Baseline**](#5-security-baseline)
- [6. **Acceptance Criteria (P0)**](#6-acceptance-criteria-p0)
- [3) Non-Skippable Gates (run in order)](#3-non-skippable-gates-run-in-order)
- [4) Wind-Down Package (always produced on brake)](#4-wind-down-package-always-produced-on-brake)
- [5) Browser Behavior → Actions (matrix)](#5-browser-behavior--actions-matrix)




## 1) Operational Stability Guard (pre-everything)
- Engages before any rehydration, audits, or gates.
- Monitors memory/CPU/timebox; acts as an emergency brake.
- If triggered, immediately creates the **Wind-Down Package** and halts work.

## 2) These are **P0 items** and their absence in modeling would indeed cause systemic failure.

---

# 🔑 SilentStacks – Canonical Baseline Operations (v2.1)

## 1. **Project Runtime Model**

* **All client-side** (static HTML + JS).
* **Offline-first** with Service Worker + IndexedDB.
* **No backend**; no server storage.
* **Hard limits:**

  * Bulk operations: **≤ 50,000 rows**.
  * External API calls throttled **≤ 2/sec**.
* **Checkpointing:** Bulk jobs persist to IndexedDB, can **resume after crash/network loss**.
* **CORS Policy:** ClinicalTrials.gov enrichment removed. **NCT IDs → linkout only**.
* **Accessibility:** Entire system targets **WCAG 2.2 AAA**.

---

## 2. **Canonical Table Headers**

Requests table **must always** include these headers in this order (baseline contract):

1. **Urgency** – request priority (Urgent / Rush / Normal).
2. **Docline #** – interlibrary loan identifier.
3. **PMID** – PubMed ID, validated `^\d{6,9}$`.
4. **Citation** – Strict **NLM format** string (title, authors, journal, year).
5. **NCT Link** – direct linkout to `https://clinicaltrials.gov/study/<NCTID>` if present, else `n/a`.
6. **Patron E-mail** – requester e-mail address, validated.
7. **Fill Status** – final column, fulfillment state (*New / In Progress / Filled / Unable / Referred*).

> Rule: **Never reorder or rename headers**. All exports and imports mirror this schema.
> All missing/invalid values are recorded as `"n/a"` — **never blank**.

---

## 3. **Dirty Data Handling**

* **Invalid rows highlighted** in table & card view.
* Commit choices:

  * **Commit Clean Only** → only valid rows persist.
  * **Commit All** → all rows persist, dirty rows marked `"n/a"`.
* **Recovery:** Dirty rows can be exported as CSV for external cleaning → reimport safe.
* **Filtering:** Dirty rows filterable for bulk updates.

---

## 4. **Export & Interop Baseline**

* **Export formats:** CSV, Excel (XLSX).
* **Variants:**

  * **Clean-only** (all validated).
  * **Full dataset** (includes dirty rows with `"n/a"`).
* **Round-trip guarantee:** Exports must re-import cleanly, with all dirty flags preserved.
* **Citation:** Always strict NLM format; PubMed is the canonical source of truth.

---

## 5. **Security Baseline**

* **XSS Protection:** Escape all HTML, sanitize all attributes on output.
* **API Injection Protection:** Regex-validate IDs, URL-encode params before fetch.
* **CORS Safety:** No direct calls to CT.gov; linkout only.
* **Storage Safety:** IndexedDB cleaned of malformed blobs; LocalStorage reserved for small settings only.
* **Dependency Integrity:** Single `dependencies.js` bundle (Fuse.js + PapaParse). SHA256 must be recorded per release.

---

## 6. **Acceptance Criteria (P0)**

* ✅ Bulk ops capped at 50k, throttled ≤ 2/sec.
* ✅ All jobs checkpoint to IndexedDB; resume after tab close/crash.
* ✅ Dirty data flagged, filtered, exportable.
* ✅ Table schema canonical (7 headers, in order, with `"n/a"` rule).
* ✅ Exports round-trip safe.
* ✅ Accessibility: keyboard nav, ≥7:1 contrast, ARIA labels, skip links, live regions.
* ✅ Security audits pass: no injection, XSS blocked, dependencies locked.

---

📌 **This baseline must be enforced in every artifact (Playbook, GAP, Dev Guide, QuickStart).**
Failure to adhere = **system-wide P0 breach**.


## 3) Non-Skippable Gates (run in order)
- **Gate 0 — Operational Stability Safety**: wrapper guard green, then canon rehydration (slice-by-slice).
- **Gate 1 — Baseline Canon Check**: baseline block present in all docs; CT.gov linkout-only; 7 headers + "n/a"; AAA stated.
- **Gate 2 — Artifact Completeness & Manifest Audit**: required docs present; individual file audits (docs-only mode); MANIFEST flags + checksums; `__audit__/` outputs.
- **Gate 3 — Regression Test Matrix**: bulk cap, headers, CT.gov linkout-only, dirty data rules, round-trip import/export, accessibility AAA.

## 4) Wind-Down Package (always produced on brake)
- `/docs/Run_Card_v2.1.md`
- `/RESUME.json`
- `/MANIFEST.json`
- `/__audit__/file_tree.txt`, `audit_listing.csv`, `required_presence.csv`, `summary.json`
- `/docs/Wind_Down_Report.md` (only if any gate red)

## 5) Browser Behavior → Actions (matrix)
- Delay/jank → Brake → Wind-Down → throttle rehydration slices.
- Freeze/hang → Hard brake → persist RESUME + Wind_Down_Report → resume next gate.
- Reload/close → Flush RESUME → mark continuation gate.
- Crash/OOM → Resume docs-only mode; minimal rehydration budget.
- Multi-tabs → Single-writer lock; observers read-only.
- High CPU → Brake; reduce parallelism; increase yields.
- Quota exceeded → Dump Wind-Down to disk; trim caches.
- Network flapping → Docs-only packaging continues; CT.gov remains linkout.
- Extension/CSP errors → Brake → Wind-Down → advise clean profile.