# SilentStacks – v1.2 Baseline → v2.0 Upgrade

SilentStacks is an **offline-first interlibrary loan & research request management platform**.  
This repo contains the **v1.2 UI** and file structure as a **locked baseline** for building v2.0 features.

---

## 📌 Baseline Status
- **UI Contract**: v1.2 HTML/CSS/JS are preserved exactly.  
- **Reference UI**: [Live v1.2 Demo](https://patrick1981.github.io/SilentStacks/)  
- **Baseline Tag**: `v1.2_baseline` (frozen commit for rollbacks)

---

## 🚀 v2.0 Goals
All new development is tracked in the master playbook:  
[`documentation/Agent_Package/PLAYBOOK_v2.0_MASTER.md`](documentation/Agent_Package/PLAYBOOK_v2.0_MASTER.md)

### Major Features (per playbook)
- **Bulk Paste & Upload** of PMIDs with enrichment from PubMed + ClinicalTrials.gov  
- **Cross-Population**: Auto-link PMID ↔ DOI ↔ NCT  
- **MeSH Auto-Tagging**: ≤5 terms, color-coded chips, clickable filters  
- **Clinical Trial Cards**: Citation + abstract snippet + trial status icon  
- **Table Enhancements**: Exact column order, sorting, and filtering without DOM restructure  
- **Accessibility**: WCAG 2.2 AAA, theme toggle (Light/Dark/High Contrast)  
- **Offline-First**: Service worker caching, offline queues for lookups/exports  
- **Exports**: JSON, CSV, NLM with blank handling rules

---

## 🛠 Development Process
- Agent Mode uses the **Baseline Declaration** in the playbook to preserve UI integrity  
- All changes logged in:
  - `CHANGELOG.md`
  - `RELEASE_NOTES.md`
  - “What changed in this build” sections in QuickStart / TechMaintenance / DevelopersGuide

---

## 📂 Key Directories
- `assets/css/` – Baseline styles (unchanged)
- `assets/js/` – Baseline scripts + new v2.0 modules
- `documentation/Agent_Package/` – Playbook, gap reports
- `documentation/` – Guides & references

---

## 📋 How to Run
Open `index.html` in any modern browser — works locally, offline, or on GitHub Pages.  

---

## 📄 License
[MIT](LICENSE)
