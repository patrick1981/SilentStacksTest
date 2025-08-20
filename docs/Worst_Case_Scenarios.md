SilentStacks – Worst‑Case Scenarios (Quick Reference)
> Canonical list is in the **Playbook**. Use this for on‑call/triage.

## Scenarios & Responses
1. **Garbage Singleton (bad PMID/DOI/NCT):**  
   - Validate → show clear error → suggest manual search.  
   - Do not clear user inputs or partial results.

2. **Doctor Email Dump (mixed IDs & titles):**  
   - Normalize; auto‑commit obvious; flag uncertain rows as **dirty**.  
   - Offer **Dirty‑Only Export** for cleanup + re‑import.

3. **Extreme Bulk (≥500k):**  
   - Reject; instruct to split into batches of **≤50k**.  

4. **Network Loss / Crash:**  
   - Checkpoint to IndexedDB; resume on reload; show progress bar.

5. **CSV Junk (quotes/commas/Excel artifacts):**  
   - Use PapaParse; fallback to regex across cells; preserve ordering.

6. **Titles‑Only w/ Typos:**  
   - Fuzzy match (Fuse.js); below threshold → **dirty**.

7. **Dirty Rows:**  
   - Never drop; `"n/a"` fill policy; safe for export/re‑import.
