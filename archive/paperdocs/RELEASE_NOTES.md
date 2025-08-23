# SilentStacks v2.0 – Release Notes

## Baseline Verification

The v2.0 work for SilentStacks is based on the immutable **v1.2** baseline.  A manual inspection of the current `index.html` and CSS files was performed against the live v1.2 reference site at **https://patrick1981.github.io/SilentStacks/**.  No structural differences were found in the DOM structure, IDs, classes, ARIA roles or tab/stepper markup when compared to the reference.  In particular:

- The header, tablist and 3‑step indicator retain the same hierarchy and identifiers.
- Table column headings and order match the v1.2 specification.
- Input fields, labels and button classes/IDs are unchanged.
- Navigation between sections (Dashboard, Add Request, All Requests, Import/Export, Settings) remains identical.

Because there are **zero structural differences** between this repository and the v1.2 baseline, development of v2.0 features can proceed without any remediation work.  Should any DOM or CSS changes become necessary during future implementation, they will be documented with before/after diffs and submitted for approval.

### Baseline Declaration

Per the playbook, we hereby declare that `index.html` and `assets/css/style.css` from this repository serve as the immutable baseline for SilentStacks v2.0.  These files are treated as read‑only for the purposes of structural comparison.  Any modifications to DOM IDs, classes, ARIA attributes, or the navigation/stepper hierarchy will result in a failed build unless explicitly approved.

### UI Snapshots

To document the baseline, screenshots of each primary section of the application were taken from the live v1.2 site.  These images serve as a reference for verifying that the v2.0 build does not introduce unintended visual or structural changes.

| Section | Screenshot |
|---|---|
| **Dashboard** | ![Dashboard]({{file:PM2MwuJZQDxFyxL52ZVFon}}) |
| **Add Request** | ![Add Request]({{file:JF64EmqfLyVhxRhMEaPHCz}}) |
| **All Requests** | ![All Requests]({{file:Jj35tW2SBaur9KNK9KTiMj}}) |
| **Import/Export** | ![Import/Export]({{file:MfmMyVCsq7Fbc7zwXN5PkH}}) |
| **Settings** | ![Settings]({{file:1DCLtuj3Ws3NTijriapGsQ}}) |

These baseline images will be used for regression checks as v2.0 functionality is added.

## New Features in v2.0

SilentStacks v2.0 introduces several major enhancements while preserving the core v1.2 experience:

- **Table View & Toggle:** A new compact table view for the All Requests page with headings *Urgency | Docline Number | PMID | Citation | Patron Name | Status*.  Users can toggle between the original card layout and this table view via a button in the results toolbar.
- **Bulk Import & PubMed Enrichment:** Users can paste a list of PMIDs into the bulk import area.  The system sanitizes the input, deduplicates identifiers, respects PubMed rate limits, and enriches each record with title, authors, journal, year, DOI and up to five MeSH terms.
- **MeSH Chips:** Enriched MeSH terms are displayed as small chips in the Citation column of the table view for quick visual reference.
- **Monolithic Build:** All CSS and JS assets are now inlined in `dist/SilentStacks_v2_monolith.html` for offline operation.  A Python script (`generate_monolith.py`) automates the build process.

Refer to the `CHANGELOG.md` for a detailed description of all changes.