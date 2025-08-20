# 🔥 SilentStacks – Worst Case Scenarios v2.1 (Unified)

**Status:** Critical Reference (P0)
**Audience:** Developers, librarians, and project leads
**Scope:** Defines failure conditions, system responses, and recovery paths. Ensures librarians never lose work, and every dirty dataset has a safe recovery path.

---

## 1. Dirty Data Dumps (Bulk Paste/Upload)

**Problem:**

* Bulk input may contain mixed identifiers (PMIDs, DOIs, NCTs, titles, junk text, Excel residue).
* Dirty/malformed rows can overwhelm librarians if committed directly.

**Mitigation:**

* Regex validation before enrichment.
* Color-coded + icon + ARIA labels for dirty rows.
* Commit options:

  * *Commit Clean Only*: Valid rows only.
  * *Commit All*: Everything inserted; dirty flagged.
* Recovery:

  * Export dirty rows for offline cleaning + re-import.
  * Filter dirty rows in UI for bulk editing.

---

## 2. Oversized Bulk Jobs

**Problem:**

* Users paste/upload massive datasets (e.g., 500k rows).
* Browser memory crashes, app locks.

**Mitigation:**

* Hard cutoff at **50,000 rows**.
* Error message: *“Job exceeds 50k row limit — please split file.”*
* Checkpointing: Progress bar + resume capability for large imports.

---

## 3. Network Loss (During Enrichment)

**Problem:**

* Enrichment run interrupted by dropped Wi-Fi.
* Risk of incomplete jobs and lost work.

**Mitigation:**

* Service worker caches shell.
* Offline queue holds requests.
* Resume from checkpoint on reconnect.
* Dirty/incomplete rows tagged “offline.”

---

## 4. Singleton Garbage IDs

**Problem:**

* Invalid identifiers like “1234” as PMID or broken DOI fragments.

**Mitigation:**

* Validators:

  * PMID = 6–9 digits
  * DOI = `10.xxxx/...`
  * NCT = `NCT########`
* UI feedback + aria-live error.
* Invalid singletons never committed.

---

## 5. Doctor Email Dump Scenario

**Problem:**

* Patron email includes DOIs, PMIDs, half-titles, and junk notes.

**Mitigation:**

* Delimiter-agnostic parser extracts valid IDs.
* Deduplication collapses duplicates.
* Clean IDs enriched/committed automatically.
* Titles/spelling errors flagged for librarian correction.

---

## 6. Dirty Storage / Data Rot

**Problem:**

* Local storage polluted with malformed values, exceeding quota.

**Mitigation:**

* IndexedDB as primary storage.
* Error log capped at 50 entries (rotating).
* Sanitization before commit.
* Export backup prompt before cleanup.

---

## 7. Accessibility Failures

**Problem:**

* Colorblind staff or screen readers cannot parse error feedback.

**Mitigation:**

* Dual signaling: color + icon + ARIA.
* aria-live announcements for AT.
* AAA contrast themes enforced across dirty-row states.

---

## 8. System Hard Failures

**Problem:**

* Browser crashes mid-job, losing progress.

**Mitigation:**

* Checkpoint every 100 rows.
* Auto-restore resume option on reload.
* Safe export of incomplete rows.

---

## 9. Bulk-Case Library Scenarios (Examples)

* **Doctor Email Dump:** Mixed identifiers, Excel junk → parse, commit clean IDs, flag others.
* **Excel Copy/Paste Garbage:** Trailing commas, broken delimiters → regex fallback, dirty flagged.
* **500k Row Attack:** Upload rejected with cutoff message.
* **50k Legit Upload:** Throttled 2/sec (\~7 hrs) with progress + checkpointing.
* **Network Loss Midway:** Processing paused, resumes on reconnect.
* **Titles-Only Dump with Typos:** Fuzzy match; low-confidence rows flagged dirty.

---

## 10. UI & Accessibility Requirements

* Dirty rows = AAA-compliant highlight + icon + ARIA.
* Bulk progress bar visible at all times.
* aria-live updates for commit steps.
* Filters for dirty rows integrated into table view.
* Empty fields always `"n/a"`.

---

# ✅ Bottom Line

SilentStacks v2.1 is built to **fail gracefully**:

* No silent data loss.
* Librarians always have a recovery path (export, filter, retry).
* Dirty data quarantined, never discarded.
* Oversized jobs rejected early.
* Long jobs checkpoint and resume safely.

**Rule of thumb:** *Auto-commit obvious IDs. Librarians finalize the rest.*
