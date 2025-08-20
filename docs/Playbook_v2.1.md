# 📘 `PLAYBOOK_v2.1.md` (Canonical, with TOC + Worst‑Case + Embedded GAP)


# SilentStacks – Project Playbook v2.1 (Canonical)
**Last Updated:** 2025-08-20 00:00 UTC  
**Rule:** This Playbook is the **single source of truth**. All other docs defer here.  
**Audit:** A fresh **GAP REPORT** is embedded at the end and must be run after every iteration.  
**Docs Standard:** All extensive docs must include a **TOC**.

## Table of Contents
- [1) Baseline Declarations](#1-baseline-declarations)
- [2) Minimal Runtime File Tree (v2.1)](#2-minimal-runtime-file-tree-v21)
- [3) Canonical Table Columns](#3-canonical-table-columns)
- [4) Accessibility — WCAG 2.2 AAA (Canonical Matrix)](#4-accessibility--wcag-22-aaa-canonical-matrix)
- [5) Security — Canonical Matrix](#5-security--canonical-matrix)
- [6) Worst‑Case Scenarios (Explicit, Canonical)](#6-worstcase-scenarios-explicit-canonical)
- [7) Exports & Interop](#7-exports--interop)
- [8) Service Worker (sw.js) — Contract](#8-service-worker-swjs--contract)
- [9) Acceptance Checklist (Run each iteration)](#9-acceptance-checklist-run-each-iteration)
- [GAP REPORT v2.1 (Embedded; run after every iteration)](#gap-report-v21-embedded-run-after-every-iteration)

---

## 1) Baseline Declarations
- **UI Contract:** v1.2 IDs/classes/roles/tab markup is binding; only minimal changes to fulfill v2.x scope.  
- **Runtime Model:** 100% client‑side. No backend.  
- **Limits:** Bulk cutoff **50,000** rows per operation; external calls throttled **≤ 2/sec**.  
- **Checkpoint/Resume:** Long jobs persist to IndexedDB; resume after tab crash or network loss.  
- **Dirty Handling:** Invalid/missing data is highlighted and stored as `"n/a"` (no blanks). **Commit Clean** vs **Commit All** toggle.  
- **Accessibility:** The **entire project targets WCAG 2.2 AAA**; tracked in this Playbook + GAP.

## 2) Minimal Runtime File Tree (v2.1)
> Keep runtime to **exactly four** files for easier debugging. Reuse the existing minified deps bundle.

```

SilentStacks/
├─ index.html          # UI + inline CSS (no separate .css)
├─ app.min.js          # Program logic (compiled/minified)
├─ dependencies.js     # Third‑party bundle (Fuse + PapaParse) — reuse your existing minified file
├─ sw\.js               # Service Worker (offline caching + sync)
└─ documentation/      # Documentation (this Playbook is canonical)

```

**Load order:** `dependencies.js` → `app.min.js` → register `sw.js` (feature‑detect).  
**Dependency policy:** No CDN at runtime. Keep filename `dependencies.js` stable; record its SHA256 on release.

## 3) Canonical Table Columns
The Requests table must contain these columns in this exact order:
1. **Priority**  
2. **Docline**  
3. **PMID**  
4. **Citation** (NLM format)  
5. **Patron Email**  
6. **Status**  
7. **Fill Status** ← *(canonical heading; added as the last column after Patron Email)*

> “Fill Status” records fulfillment state (e.g., *New / In Progress / Filled / Unable / Referred*).

## 4) Accessibility — WCAG 2.2 AAA (Canonical Matrix)
| Guideline | SC | Level | Status | Notes |
|---|---|---:|:---:|---|
| Contrast (Enhanced) | 1.4.6 | AAA | ✅ | Tokens locked to ≥7:1 (≥4.5:1 large) |
| Visual Presentation | 1.4.8 | AAA | ⚠ | Preferences panel (line spacing/width) |
| Images of Text | 1.4.9 | AAA | ✅ | No text-in-images |
| Keyboard (No Exception) | 2.1.3 | AAA | ✅ | Full keyboard paths |
| No Timing | 2.2.3 | AAA | ✅ | No timeouts |
| Three Flashes | 2.3.2 | AAA | ✅ | No flashing |
| Location | 2.4.8 | AAA | ⚠ | Breadcrumb/location cues |
| Link Purpose (Link‑Only) | 2.4.9 | AAA | ✅ | Self‑describing links |
| Section Headings | 2.4.10 | AAA | ✅ | Semantic structure |
| Focus Not Obscured (Enhanced) | 2.4.12 | AAA | ⚠ | Test under sticky headers |
| Focus Appearance | 2.4.13 | AAA | ✅ | Thick, high‑contrast outlines |
| Identify Purpose | 1.3.6 | AAA | ✅ | ARIA + autocomplete |
| Accessible Authentication | 3.3.9 | AAA | N/A | No auth |
| Redundant Entry / Consistent Help | 3.3.7 / 3.3.8 | A/AA | ⚠ | Persistent Help affordance |

## 5) Security — Canonical Matrix
| Risk | Control | Status | Notes |
|---|---|:---:|---|
| XSS | Sanitize inputs; escape attributes/HTML on output | ✅ | Validations live at parse & render |
| API Injection | Regex‑validate & URL‑encode IDs | ✅ | PMID/DOI/NCT validators enforced |
| CORS Misuse | CT.gov API disabled → **linkout only** | ✅ | No cross‑origin fetch to CT.gov |
| Data Hygiene | Exports normalized; `"n/a"` enforced | ✅ | No blanks in CSV/Excel |
| Storage Safety | IndexedDB audit/cleanup | ⚠ | Final pass pending |
| Dependency Integrity | Local‑only `dependencies.js`; record SHA256 each release | ⚠ | Add hash to release notes |

## 6) Worst‑Case Scenarios (Explicit, Canonical)
- **Garbage Singleton (bad PMID/DOI/NCT):** fail gracefully; suggest manual search; do not mutate user‑entered values.  
- **Doctor Email Dump (mixed PMIDs/DOIs/half‑titles):** normalize; auto‑commit obvious; flag uncertainties as dirty.  
- **Extreme Bulk (≥500k tokens):** reject with clear guidance to split into ≤50k batches.  
- **Network Loss / Crash:** checkpoint progress to IndexedDB; resume upon reopen.  
- **CSV Junk (quotes/commas/Excel artifacts):** robust CSV parser with regex fallback across all cells.  
- **Titles‑Only w/ Typos:** fuzzy match below threshold → flagged dirty.  
- **Dirty Rows:** never dropped; written as `"n/a"`; export **Dirty‑Only** for cleanup.

*(Quick‑reference duplicate lives in `Worst_Case_Scenarios.md`; this section is canonical.)*

## 7) Exports & Interop
- Strict **NLM citation** format.  
- Export **Clean‑Only** vs **Full**; both re‑import safe.  
- **No blank fields** in exports — use `"n/a"`.

## 8) Service Worker (sw.js) — Contract
- **Cache list:** `index.html`, `app.min.js`, `dependencies.js`, `sw.js`.  
- **Strategy:** offline‑first for cached assets; network when available.  
- **Versioning:** bump `CACHE_VERSION` per release; delete old caches on activate.

## 9) Acceptance Checklist (Run each iteration)
- [ ] AAA checks: contrast, keyboard, headings, link purpose, focus (track pendings).  
- [ ] Bulk cutoff 50k enforced; mixed IDs handled; **Dirty‑Only Export** verified.  
- [ ] Checkpoint/resume validated (close tab → reopen).  
- [ ] Exports round‑trip; `"n/a"` preserved.  
- [ ] Security spot‑checks (XSS/API injection); `dependencies.js` SHA256 recorded if changed.  
- [ ] **Run the GAP REPORT below**; attach to release notes.

---

# GAP REPORT v2.1 (Embedded; run after every iteration)
**Run:** 2025-08-20 00:00 UTC  
**Maintainer:** Solo + AI‑assisted  
**Canonical Source:** This Playbook

## Table of Contents
- [Status Overview](#status-overview)
- [WCAG AAA Snapshot](#wcag-aaa-snapshot)
- [Security Snapshot](#security-snapshot)
- [Worst‑Case Scenarios (Verified)](#worst-case-scenarios-verified)
- [Priorities to Close v2.1](#priorities-to-close-v21)
- [Release Decision](#release-decision)
- [Acceptance (This Iteration)](#acceptance-this-iteration)

### Status Overview
| Area | v2.1 Current | Notes |
|---|---|---|
| Core UI Contract | ✅ Preserved | v1.2 IDs/roles/tabs intact |
| Enrichment (PMID/DOI/NCT) | ✅ Stable/Partial | NCT chips stable; row wiring WIP |
| Bulk Ops | ✅ Stable | Mixed IDs parsed; dedupe; 50k cutoff |
| Bulk Update/Delete | ⚠ Partial | Logic present; UI binding pending |
| Offline (SW/IDB) | ⚠ Partial | IDB stable; SW cache/versioning to finalize |
| Exports | ✅ Stable | Clean vs Full; re‑import safe |
| Accessibility (AAA) | ⚠ Pending | 1.4.8, 2.4.8, 2.4.12, 3.3.7/8 outstanding |
| Security | ⚠ Pass 2 | Storage audit + dep hash process pending |
| Dependencies | ✅ Consolidated | Single `dependencies.js` (Fuse+PapaParse) |

### WCAG AAA Snapshot
See the canonical matrix above. Snapshot remains consistent.

### Security Snapshot
- ✅ XSS sanitize/escape; API‑injection validated/encoded; CT.gov linkout‑only; `"n/a"` hygiene  
- ⚠ Storage safety audit; dependency SHA256 process

### Worst‑Case Scenarios (Verified)
Dirty paste, extreme bulk rejection, network loss resume, CSV junk tolerance, titles‑only fuzzy thresholding → **exercised this iteration**.

### Priorities to Close v2.1
1. Bind NCT/MeSH chips into cards & table.  
2. Wire bulk update/delete UI.  
3. Finalize SW cache/version upgrade path.  
4. Complete AAA audit & remediate pendings.  
5. Formalize dependency integrity (record SHA256 of `dependencies.js` on release).

### Release Decision
- **Demo‑ready:** ✅  
- **Production‑ready:** ⚠ Pending SW hardening + AAA closeout.

### Acceptance (This Iteration)
- ✅ Worst‑case suite run  
- ✅ Cutoff + export round‑trip OK  
- ⚠ AAA pendings tracked  
- ⚠ Storage/dep integrity audit queued


---
