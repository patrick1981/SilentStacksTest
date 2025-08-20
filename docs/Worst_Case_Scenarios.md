# SilentStacks Worst-Case Scenarios (v2.1)

## 📋 Overview
This document outlines **worst-case scenarios** for both **single request operations** and **bulk paste/upload operations**. 
It is intended to serve as a practical reference for librarians, developers, and AI collaborators to ensure the system can 
handle messy real-world inputs under "doctors too busy to care" conditions.

---

## 1. Single Request Scenarios

### ✅ Normal Case
- User enters a valid PMID → PubMed lookup works.
- DOI cross-check is consistent.
- Metadata fills correctly.

### ⚠️ Worst Cases
1. **Garbage PMID**
   - Input: "123" or "ABC123"
   - Behavior: Validation error → `"PMID must be 6–9 digits."`
   - Resolution: Fail gracefully, suggest search.

2. **Garbage DOI**
   - Input: "10.bad.doi" or "abc10.1234"
   - Behavior: Validation error → `"Enter DOI"`.
   - Resolution: Fail gracefully, librarian edits manually.

3. **Garbage NCT**
   - Input: "NCT12"
   - Behavior: Validation error → `"Enter NCT########"`.
   - Resolution: Librarian search or manual entry.

4. **User pastes article title only**
   - Behavior: No identifier match.
   - Resolution: Suggest librarian performs manual search. Placeholder row may be created with `n/a` fields.

---

## 2. Bulk Paste / Upload Scenarios

### ✅ Normal Case
- Paste or upload clean CSV with `pmid, doi, nct` headers.
- All metadata fetched, table rows filled.

### ⚠️ Worst Cases
1. **Doctor Email Dump**
   - Input: Mixed PMIDs, DOIs, article titles, Excel junk, misspelled words, diacritics.
   - Behavior: 
     - Parse PMIDs/DOIs.
     - Titles-only fallback to placeholder row with `n/a`.
     - Dirty rows highlighted in red.
   - Resolution: Auto-commit obvious IDs; librarian cleans flagged rows.

2. **Mixed Identifiers**
   - Input: CSV with some rows PMID, some DOI, some blank.
   - Behavior: Clean rows committed; dirty rows flagged.
   - Resolution: Commit Clean vs Commit All.

3. **Excel Copy/Paste Garbage**
   - Input: Trailing commas, broken delimiters, extra columns.
   - Behavior: Regex fallback → extract what’s possible.
   - Resolution: Dirty rows flagged.

4. **500k Row Attack**
   - Input: Upload massive file with >500k rows.
   - Behavior: Hard cutoff at 50k rows. 
   - Resolution: User shown rejection message.

5. **50k Row Legit Upload**
   - Input: 50,000 PMIDs pasted.
   - Behavior: 
     - Throttled to 2/sec → ~7 hours runtime.
     - Progress indicator shown.
     - Checkpointing & resume required.
   - Resolution: Auto-save progress to IndexedDB.

6. **Network Loss Midway**
   - Input: Upload starts fine, network drops after 5k rows.
   - Behavior: Processing paused.
   - Resolution: Resume from last checkpoint.

---

## 3. Post-Commit Editing

### ✅ Normal Case
- User reviews clean data in table.

### ⚠️ Worst Cases
- Dirty rows not cleaned before commit.
- "Commit Clean Only" leaves dirty rows in holding area.
- "Commit All" inserts all rows but dirty ones highlighted.

**Resolutions:**
- Librarian filters dirty rows by color → bulk edits.
- Or exports dirty-only subset for offline cleanup & re-import.

---

## 4. UI Requirements

- Dirty rows highlighted with contrasting color (AAA-compliant).
- Progress bar for bulk jobs.
- Aria-live status messages for every commit step.
- Filters for dirty rows built into table view.

---

## 5. Accessibility & Data Integrity

- **Empty fields** → filled with `"n/a"`, never left blank.
- **Strict NLM format** enforced for citations.
- **Screen reader support** for errors and bulk progress.

---

## ✅ Summary

SilentStacks bulk and single-request workflows are designed to survive:
- Dirty inputs.
- Huge jobs (≤50k rows).
- API failures.
- Network loss.
- Human messiness.

**Rule of thumb:** *Auto-commit obvious cases. Librarian finalizes the rest.*
