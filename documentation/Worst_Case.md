Got it — let’s make the **Worst Case Scenarios** doc explicit and standalone (because this is one of your P0 benchmarks). This version folds in everything we discussed about dirty data, network loss, and librarian workflows.

---

# 🔥 SilentStacks Worst Case Scenarios v2.1

**Status:** Critical reference (P0)
**Audience:** Developers, librarians, and project leads
**Scope:** Defines failure conditions, system responses, and recovery paths

---

## 1. **Dirty Data Dumps (Bulk Paste/Upload)**

### Problem

* Bulk input contains **mixed identifiers**: PMIDs, DOIs, NCTs, titles, junk text, Excel residue.
* Dirty/malformed rows overwhelm librarians if committed directly.

### Mitigation

* **Validation First**: Regex validation before enrichment.
* **Color-Coded Errors**: Dirty rows highlighted red/yellow in UI.
* **Commit Options**:

  * *Commit Clean Only*: Inserts validated rows only.
  * *Commit All*: Inserts everything; dirty rows flagged for later.
* **Recovery Paths**:

  * Export dirty rows → offline cleaning → re-import.
  * Filter by error color → bulk edit/update later.

---

## 2. **Oversized Bulk Jobs**

### Problem

* Users paste/upload massive datasets (e.g., 500k records).
* Browser memory crashes, app becomes unusable.

### Mitigation

* **Hard Cutoff**: 50,000 rows max per job.
* **Error Message**: “Job exceeds 50k row limit — please split file.”
* **Checkpointing**: Progress bar + resume capability for long imports.

---

## 3. **Network Loss (During Enrichment)**

### Problem

* Librarian begins bulk enrichment; Wi-Fi drops mid-run.
* Risk of incomplete jobs and lost work.

### Mitigation

* **Service Worker Caching**: App shell stays usable offline.
* **Offline Queue**: Requests queued until connection restored.
* **Resume on Reconnect**: Import resumes from last checkpoint.
* **Placeholder Rows**: Dirty/incomplete rows tagged “offline” for librarian awareness.

---

## 4. **Singleton Garbage IDs**

### Problem

* User enters invalid identifiers (e.g., “1234” as PMID, random DOI fragments).

### Mitigation

* **Regex Validators**:

  * PMID → 6–9 digits only
  * DOI → `10.xxxx/...` format
  * NCT → `NCT########`
* **UI Feedback**: Inline error messages, screen reader announcement.
* **No Commit**: Invalid singletons never enter the main table.

---

## 5. **Doctor Email Dump Scenario**

### Problem

* Patron sends a bulk email with half-written citations: DOIs, PMIDs, titles, and random notes.
* Librarian pastes entire block into SilentStacks.

### Mitigation

* **Delimiter-Agnostic Parser**: Regex extracts valid identifiers.
* **Deduplication**: Duplicate IDs collapsed.
* **Auto-Enrichment**: Clean IDs enriched and committed.
* **Librarian Review**: Titles/spelling errors flagged for manual correction.

---

## 6. **Dirty Storage / Data Rot**

### Problem

* Local storage polluted with junk values, exceeding quota.

### Mitigation

* **IndexedDB Primary Storage**: Handles large datasets safely.
* **Bounded Error Log**: Max 50 entries, rotated.
* **Sanitization**: All values cleaned before commit.
* **Export Backup**: Librarians prompted to export dataset before cleanup.

---

## 7. **Accessibility Failures**

### Problem

* Colorblind staff cannot distinguish clean/dirty rows.
* Screen reader cannot parse error feedback.

### Mitigation

* **Dual Signaling**: Color + icon + ARIA label for dirty rows.
* **aria-live Announcements**: Errors/success announced to AT.
* **AAA Contrast Themes**: Light, dark, high-contrast enforced.

---

## 8. **System Hard Failures**

### Problem

* Browser crashes mid-job, system loses progress.

### Mitigation

* **Checkpointing**: Progress saved every 100 rows.
* **Auto-Restore**: Resume option on reload.
* **Safe Export**: Incomplete rows exported for recovery.

---

# ✅ Bottom Line

SilentStacks v2.1 is designed to **fail gracefully**:

* No silent data loss.
* Librarians always have a **recovery path** (export, filter, retry).
* Dirty data is quarantined, not discarded.
* Oversized jobs rejected before they break the browser.

---

Do you want me to **zip this together with the Playbook + Gap Report** right now (core P0 docs), or keep regenerating the rest (Exec Summary, Feature List, etc.) before packaging?
