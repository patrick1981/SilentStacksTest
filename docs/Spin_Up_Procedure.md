# 🚀 Spin-Up Procedure (v2.1)

## Table of Contents
- [🔁 Auto‑Repair Policy (v2.1)](#-autorepair-policy-v21)



1. **Wrapper Stability Guard** engages (pre-everything).  
2. **Gate 0** canon rehydration (slice-by-slice) under guard budgets.  
3. **Upload Audit** (docs-only): file tree, required presence, placeholder scan → write to `__audit__/`.  
4. **Run Card** set to Gate 1 pending.

## 🔁 Auto‑Repair Policy (v2.1)

**Rule:** On any gate failure (G0–G3), do **not** prompt the maintainer for repair. Automatically execute the minimal, deterministic fix and re‑run the failing gate(s). **Inform** the maintainer once the issue is corrected and attach the run report.

**Scope of automatic fixes:**
- **G2 (Checksums/Completeness):** Recompute checksums and update `MANIFEST.json` if files are present and non‑empty; restore missing files from the WindDown bundle when available.
- **G3 (Doc Regression):** Normalize Markdown docs (ensure H1 title and explicit `v2.1` mention) and validate `Run_Card_v2.1.md` includes a “Next Steps / Actions / Procedure” block.
- **Non‑destructive:** All fixes are additive or metadata‑level. Content semantics are not altered.
- **Audit trail:** All changes are logged to `__audit__/summary.json` with timestamps and fix notes.
