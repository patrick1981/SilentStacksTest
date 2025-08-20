# SilentStacks Feature List v2.1

---

## Core Features
- **Client-Only App:** Runs from any browser.  
- **IndexedDB Storage:** Handles 50k+ records.  
- **LocalStorage State:** Saves preferences + progress.  

---

## Request Entry
- Single entry (PMID, DOI, Title).  
- Metadata enrichment from PubMed + CrossRef.  
- Deduplication + consistency checks.  
- Auto-save to table + card view.  

---

## Bulk Operations
- Input methods: paste, CSV, TXT, JSON.  
- Normalization for PMIDs, DOIs, NCTs.  
- Mixed identifiers handled.  
- Error highlighting + dirty-only export.  
- Commit Clean vs Commit All.  

---

## Accessibility (WCAG 2.2 AAA)
- High contrast (≥7:1).  
- Keyboard-only operability.  
- Semantic headings, ARIA labeling.  
- Focus visible + unobscured.  
- Preferences for line spacing/width (pending).  
- Breadcrumb/location cues (pending).  
- Consistent Help affordance (pending).  

---

## Security
- Input sanitization (XSS).  
- Identifier encoding (API injection prevention).  
- Local-only dependencies.  
- CT.gov integration removed.  

---

## Exports
- Strict NLM citation format.  
- Clean-only vs full dataset.  
- “n/a” fill preserved.  
- CSV/Excel re-import safe.  

---

## Worst-Case Scenarios
- Garbage ID → graceful fail.  
- Bulk >50k → reject.  
- Network loss → checkpoint + resume.  
- Doctor dump → normalized.  

---

## Deployment Options
- **GitHub Pages** (idiot-proof guide included).  
- **Thumbdrive** (offline use).  
- **Desktop** (double-click `index.html`).  
