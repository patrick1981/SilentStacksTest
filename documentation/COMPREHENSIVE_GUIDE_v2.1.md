../# SilentStacks Comprehensive Guide v2.1
**Run date:** 2025-08-20  
**Status:** Living Document — update on every run.

---

# Table of Contents
1. [Project Summary & Vision](#project-summary--vision)  
2. [Methodology & Iterations](#methodology--iterations)  
3. [Core Features](#core-features)  
4. [Playbook Snapshot](#playbook-snapshot)  
5. [Gap Report Snapshot](#gap-report-snapshot)  
6. [Security Conformance Matrix](#security-conformance-matrix)  
7. [Accessibility Conformance Matrix (WCAG 2.2 AAA)](#accessibility-conformance-matrix-wcag-22-aaa)  
8. [Worst-Case Scenarios](#worst-case-scenarios)  
9. [Acceptance Checklist](#acceptance-checklist)  
10. [Deployment Options](#deployment-options)  
11. [Preservation & Upkeep](#preservation--upkeep)  
12. [Handoff Guidance](#handoff-guidance)  

---

## Project Summary & Vision
SilentStacks is an **offline-first, interlibrary loan (ILL) management system**. It is designed for **ages 8–80**, with idiot-proof workflows, WCAG 2.2 AAA accessibility, and strict client-side security.

**Vision:**  
A librarian-friendly tool that runs anywhere: GitHub Pages, thumbdrive, or desktop. No backend needed.

---

## Methodology & Iterations
- **v1.2 baseline**: stable UI, minimal features.  
- **v2.0**: bulk operations, metadata enrichment, NCT chips.  
- **v2.1**: pivot away from CT.gov API, modularized repo, AAA accessibility baseline, comprehensive documentation.  
- **Living documentation**: Playbook + Gap Report + Compliance Appendix updated with every iteration.  

---

## Core Features
- Single request entry (PMID/DOI/Title).  
- Bulk operations: paste, CSV, TXT, JSON.  
- Metadata enrichment (PubMed, CrossRef).  
- IndexedDB storage (50k+ records).  
- Exports: NLM citation, clean-only vs full, re-import safe.  
- Accessibility: WCAG 2.2 AAA baseline.  
- Security: sanitization, identifier encoding, no CT.gov calls.  

---

## Playbook Snapshot
- **Cutoff:** 50k rows.  
- **Rate limit:** 2/sec PubMed.  
- **Checkpoint/resume:** spec implemented, UI wiring pending.  
- **Dirty data:** highlighted, exportable.  
- **Accessibility:** AAA enforced.  

---

## Gap Report Snapshot
✅ Met: bulk cutoff, “n/a” fill, dirty export, AAA baseline.  
⚠ Pending: preferences panel (1.4.8), breadcrumbs (2.4.8), focus (2.4.12), consistent Help (3.3.7/8).  
❌ Out: CT.gov API.  

---

## Security Conformance Matrix

| Area | Requirement | Status |
|------|-------------|--------|
| XSS | Sanitize all inputs/outputs | ✅ Met |
| API Injection | Encode IDs before API calls | ✅ Met |
| CT.gov API | Disabled | ✅ Met |
| Storage | IndexedDB/localStorage bounded | ✅ Met |
| Dependencies | Local copies, no CDN | ✅ Met |

---

## Accessibility Conformance Matrix (WCAG 2.2 AAA)

| Guideline | SC | Status |
|-----------|----|--------|
| 1.4.6 Contrast | AAA | ✅ |
| 1.4.8 Visual Presentation | AAA | ⚠ Pending |
| 1.4.9 Images of Text | AAA | ✅ |
| 2.1.3 Keyboard (No Exception) | AAA | ✅ |
| 2.2.3 No Timing | AAA | ✅ |
| 2.3.2 Three Flashes | AAA | ✅ |
| 2.4.8 Location | AAA | ⚠ Pending |
| 2.4.9 Link Purpose | AAA | ✅ |
| 2.4.10 Section Headings | AAA | ✅ |
| 2.4.12 Focus Not Obscured | AAA | ⚠ Pending |
| 2.4.13 Focus Appearance | AAA | ✅ |
| 1.3.6 Identify Purpose | AAA | ✅ |
| 3.3.7/8 Redundant Entry & Help | A/AA tracked | ⚠ Pending |
| 1.2.x Media Alternatives | AAA | N/A |

---

## Worst-Case Scenarios
- Garbage single ID → graceful fail.  
- Bulk >50k → reject.  
- Network loss → checkpoint/resume.  
- Mixed identifiers → flagged + export offered.  
- Doctor dump (mixed PMIDs/DOIs/titles) → normalized, librarian finalizes.  

---

## Acceptance Checklist
- ✅ Bulk cutoff enforced.  
- ✅ “n/a” fill preserved.  
- ✅ Dirty-only export tested.  
- ✅ AAA baseline checks passed.  
- ⚠ Final AAA items pending (1.4.8, 2.4.8, 2.4.12, 3.3.7/8).  

---

## Deployment Options
- **GitHub Pages:** step-by-step idiot-proof setup in Quickstart/User Guide.  
- **Thumbdrive:** copy repo, open `index.html`.  
- **Desktop:** double-click `index.html`.  

---

## Preservation & Upkeep
- Preservation Checklist tracks archival integrity.  
- Upkeep doc details patch cadence, accessibility audits, and doc updates.  

---

## Handoff Guidance
- Handoff Guide includes AI prompt for new sessions.  
- Selector Map appendix ensures multi-AI consistency.  
- Living doc (this file) updated each iteration.  

---
