🛠️ `DEVELOPER_GUIDE_v2.1.md`


# SilentStacks Developer Guide v2.1

## Table of Contents
- [Runtime & Load Order](#runtime--load-order)
- [Selectors & Adapter Contract](#selectors--adapter-contract)
- [Validators](#validators)
- [Security Rules](#security-rules)
- [Service Worker](#service-worker)
- [Acceptance Tests](#acceptance-tests)
- [Dependency Integrity](#dependency-integrity)

## Runtime & Load Order
Files: `index.html` (inline CSS), `dependencies.js`, `app.min.js`, `sw.js`.  
Load order: **dependencies → app → register SW**. No CDN.

## Selectors & Adapter Contract
- **Selector map** lives in `Selector_Map_v2.1.md`.  
- Do **not** fork enrichment logic; only update selectors if the UI changes.

## Validators
- PMID: `^\d{6,9}$`  
- DOI: `^10\.\S+$`  
- NCT: `^NCT\d{8}$` (case‑insensitive)

## Security Rules
- Sanitize all inputs; escape attributes/HTML on output.  
- Regex‑validate IDs; **URL‑encode** before API calls.  
- CT.gov API calls **disabled**; provide **linkout** only.

## Service Worker
- Cache `index.html`, `app.min.js`, `dependencies.js`, `sw.js`.  
- Bump `CACHE_VERSION` each release; clean old caches on activate.

## Acceptance Tests
- Single IDs populate fields/chips and add table rows.  
- Mixed bulk list honors order; dedup works.  
- **50k cutoff** enforced; **Dirty‑Only Export** works.  
- Exports **round‑trip**; `"n/a"` preserved.  
- Contrast, focus, keyboard checks pass.

## Dependency Integrity
- Keep one file: **`dependencies.js`** (Fuse + PapaParse).  
- On release, compute and record **SHA256** in release notes.
