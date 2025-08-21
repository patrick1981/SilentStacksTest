# 🔥 SilentStacks – Worst Case Scenarios 

**Status:** v2.1 Draft – Canonical reference
**Maintainer:** Solo + AI-assisted
**Rule:** This doc is **P0**. All other references (Playbook, GAP) must defer here.
**Scope:** Defines 40 explicit worst-case scenarios, mitigation strategies, and acceptance checks.

---

## 📑 Table of Contents

* [Case 1–10](#case-1-10)
* [Case 11–20](#case-11-20)
* [Case 21–30](#case-21-30)
* [Case 31–40](#case-31-40)

---

## Case 1–10

### Case 1. **Garbage PMID input**

* Trigger: User enters `123abc`.
* UI: Inline error “Invalid PMID.”
* Storage: Not committed.
* User Workflow: User retries.
* Logging: `invalid PMID`.

### Case 2. **Garbage DOI input**

* Trigger: User enters `10.@@##bad`.
* UI: Inline error “Invalid DOI.”
* Storage: Not committed.
* Logging: `invalid DOI`.

### Case 3. **Nonexistent NCT ID**

* Trigger: `NCT99999999`.
* UI: Toast “No trial found.”
* Storage: `"n/a"`.
* Logging: `NCT not found`.

### Case 4. **Mixed IDs in bulk paste**

* Trigger: PMIDs + DOIs + free text.
* UI: Good IDs processed, dirty rows highlighted.
* Storage: Clean committed; dirty → `"n/a"`.
* Workflow: User filters dirty for re-work.
* Logging: `mixed bulk`.

### Case 5. **Extreme bulk flood**

* Trigger: >500k IDs.
* UI: Reject with “50k cutoff.”
* Storage: None.
* Logging: `bulk flood`.

### Case 6. **Network loss during 50k job**

* Trigger: Wi-Fi drops.
* UI: Banner “Resuming from checkpoint.”
* Storage: IndexedDB checkpoint.
* Logging: `resume after network loss`.

### Case 7. **Dirty Excel upload**

* Trigger: CSV with misaligned commas.
* UI: Alert “Malformed rows flagged dirty.”
* Storage: Clean committed, dirty flagged.
* Logging: `CSV parse error`.

### Case 8. **Doctor’s email dump**

* Trigger: Free-form text pasted.
* UI: Obvious IDs parsed; rest flagged dirty.
* Storage: Dirty = `"n/a"`.
* Logging: `free text dirty`.

### Case 9. **Tab crash mid-job**

* Trigger: Browser crash.
* UI: On reopen, “Resuming job…”
* Storage: Resume via IndexedDB.
* Logging: `resume after crash`.

### Case 10. **User closes tab accidentally**

* Trigger: Tab closed.
* Same as Case 9.

---

## Case 11–20

### Case 11. **MeSH API missing tags**

* Trigger: PubMed returns no MeSH.
* UI: “No MeSH terms found.”
* Storage: `"n/a"`.
* Logging: `MeSH missing`.

### Case 12. **CrossRef API returns 404**

* Trigger: DOI not found.
* UI: “Metadata not found.”
* Storage: `"n/a"`.
* Logging: `CrossRef 404`.

### Case 13. **ClinicalTrials.gov schema change**

* Trigger: Unexpected response shape.
* UI: “Trial data unavailable.”
* Storage: `"n/a"`.
* Logging: `CT schema mismatch`.

### Case 14. **Clipboard paste with emojis**

* Trigger: 😅 pasted in input.
* UI: Invalid char error.
* Storage: Not committed.
* Logging: `invalid char`.

### Case 15. **Row mismatch between APIs**

* Trigger: PubMed vs CrossRef mismatch.
* UI: Badge “Conflict detected.”
* Storage: Dirty flag.
* Logging: `metadata mismatch`.

### Case 16. **User bulk-commits all dirty rows**

* Trigger: User chooses “Commit All.”
* UI: Dirty still highlighted.
* Storage: `"n/a"` in dirty fields.
* Logging: `force commit`.

### Case 17. **User commits clean only**

* Trigger: User chooses “Commit Clean.”
* UI: Dirty rows remain visible.
* Storage: Only clean rows saved.
* Logging: `commit clean`.

### Case 18. **Export dirty-only dataset**

* Trigger: User selects “Export dirty.”
* UI: CSV with only flagged rows.
* Storage: Export safe.
* Logging: `export dirty`.

### Case 19. **Export → re-import loop**

* Trigger: Export CSV → edit → re-import.
* UI: Formula/junk stripped.
* Storage: `"n/a"` where artifacts removed.
* Logging: `round-trip`.

### Case 20. **User tries unsupported file**

* Trigger: Upload `.pdf`.
* UI: “Unsupported file format.”
* Storage: None.
* Logging: `bad file type`.

---

## Case 21–30

### Case 21. **Duplicate PMIDs**

* Trigger: Same PMID pasted twice.
* UI: “Duplicate skipped.”
* Storage: One committed.
* Logging: `duplicate PMID`.

### Case 22. **Case-sensitive DOI variance**

* Trigger: DOI pasted in caps.
* Storage: Normalized to lowercase.
* Logging: `doi normalized`.

### Case 23. **Network throttle by PubMed**

* Trigger: >2/sec.
* UI: Banner “Pausing to respect limits.”
* Storage: Queue waits.
* Logging: `api throttled`.

### Case 24. **Queue corruption**

* Trigger: IDB queue partially lost.
* UI: Resume from last intact.
* Storage: Clean safe.
* Logging: `queue corruption`.

### Case 25. **XSS attempt in note field**

* Trigger: `<script>` input.
* Storage: Escaped; saved literally.
* Logging: `XSS blocked`.

### Case 26. **Injection in DOI**

* Trigger: `10.1000/123?<script>`
* Storage: Sanitized.
* Logging: `DOI injection blocked`.

### Case 27. **Outdated browser w/o IDB**

* Trigger: IE11.
* UI: Banner “Storage unavailable.”
* Storage: Fallback = localStorage.
* Logging: `IDB not supported`.

### Case 28. **User clears localStorage**

* Trigger: Clears manually.
* UI: Banner “Settings reset.”
* Storage: Defaults restored.
* Logging: `settings reset`.

### Case 29. **Quota exceeded in IDB**

* Trigger: Storage full.
* UI: “Quota exceeded.”
* Storage: Stop committing.
* Logging: `quota exceeded`.

### Case 30. **Malformed CSV from vendor**

* Trigger: Badly encoded file.
* UI: “Encoding error.”
* Storage: Dirty flagged.
* Logging: `CSV encoding`.

---

## Case 31–40

### Case 31. **Large JSON import with recursion**

* Trigger: Nested JSON.
* UI: “Flattened schema.”
* Storage: Canonical fields only.
* Logging: `json flatten`.

### Case 32. **Clipboard paste overflow**

* Trigger: 200k IDs.
* UI: “Exceeded 50k cutoff.”
* Logging: `paste overflow`.

### Case 33. **Checkpoint corruption**

* Trigger: IDB checkpoint invalid.
* UI: “Could not resume.”
* Storage: Restart job.
* Logging: `checkpoint corruption`.

### Case 34. **Offline edit**

* Trigger: User edits offline.
* UI: “Saved locally.”
* Storage: Sync later.
* Logging: `offline edit`.

### Case 35. **Tab discarded**

* Trigger: Browser discards tab.
* UI: Resume from checkpoint.
* Logging: `resume after discard`.

### Case 36. **API mismatch**

* Trigger: Different titles.
* UI: “Metadata mismatch.”
* Storage: Dirty flag.
* Logging: `api mismatch`.

### Case 37. **Invalid characters in IDs**

* Trigger: Emoji in DOI.
* UI: Inline error.
* Logging: `invalid ID chars`.

### Case 38. **Export → re-import formula artifacts**

* Trigger: Excel adds formulas.
* UI: Alert “Formulas removed.”
* Storage: `"n/a"` substitution.
* Logging: `formula scrub`.

### Case 39. **API ban triggered**

* Trigger: Excessive requests.
* UI: “API temporarily blocked.”
* Storage: Queue paused.
* Logging: `api ban`.

### Case 40. **Unsupported export format**

* Trigger: User requests XLSX.
* UI: Error “Unsupported.”
* Logging: `unsupported export`.


