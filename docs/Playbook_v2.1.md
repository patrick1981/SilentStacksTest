# SilentStacks Playbook v2.1

**Status:** Canonical, single source of truth  
**Last Updated:** 2025-08-21  

---

## Table of Contents
1. [Introduction](#1-introduction)  
2. [Core Objectives](#2-core-objectives)  
3. [P0 Benchmarks](#3-p0-benchmarks)  
4. [Data Architecture](#4-data-architecture)  
5. [Bulk Operations](#5-bulk-operations)  
6. [Metadata Enrichment](#6-metadata-enrichment)  
7. [UI & Accessibility](#7-ui--accessibility)  
8. [Offline Support](#8-offline-support)  
9. [Export & Reporting](#9-export--reporting)  
10. [Governance & Compliance](#10-governance--compliance)  
11. [Operational Rules](#11-operational-rules)  
12. [Accessibility Roadmap — WCAG 2.2 AAA](#12-accessibility-roadmap--wcag-22-aaa)  
13. [References](#13-references)  

---

## 1. Introduction
SilentStacks is an offline-first, accessible interlibrary loan (ILL) and request management platform built for healthcare and academic libraries.  
This Playbook is the **canonical operational guide**. All other documents (Feature List, Developer Guide, Compliance, GAP Report, etc.) defer to this file.

---

## 2. Core Objectives
- **Client-only execution:** No server-side persistence; IndexedDB + LocalStorage only.
- **Healthcare IT alignment:** HIPAA safe (no PHI), AAA accessibility.
- **Metadata enrichment:** PubMed, CrossRef, ClinicalTrials.gov.
- **Reliability:** Operates under unreliable networks with retry logic.
- **Uniformity:** Headers, request schema, linkouts consistent across system.

---

## 3. P0 Benchmarks
These define minimum viable stability:

- **Bulk operations** up to 50,000 rows.
- **Throttling:** PubMed ≤ 2 requests/sec.
- **Headers:** Canonical CSV headers, with auto-map dictionary.
- **Linkout pivot:** PMID/DOI/NCT linkouts consistent across card + table.
- **AAA accessibility:** WCAG 2.2 AAA roadmap, continuous audit.

---

## 4. Data Architecture
- **IndexedDB** → request storage, bulk imports.
- **LocalStorage** → preferences, UI state.
- **Service Worker** → offline cache + background sync.
- **Cutoff:** 50,000 rows/job.

---

## 5. Bulk Operations
- **CSV & Paste** accepted.
- **Validation** against canonical headers.
- **Retry Queue** for failures with exponential backoff.
- **UI Feedback:** ARIA live regions + AAA contrast.

---

## 6. Metadata Enrichment
- **PubMed** (ESummary/EFetch).
- **CrossRef** fallback for DOI/title.
- **ClinicalTrials.gov** for NCT ID.
- **Mismatch detection** → flagged in UI.

---

## 7. UI & Accessibility
- **Semantic HTML5**, ARIA roles, captions.
- **Keyboard-first nav** (skip links, focus outlines).
- **High-contrast theme**.
- **Help/FAQ** panel maintained.

---
## 8. Offline Support
- **Service Worker** handles cache-first strategy with network fallback.
- **Background Sync** queues requests for later retry.
- **IndexedDB Sync** ensures no data loss during disconnects.

---

## 9. Export & Reporting
- **CSV export** with canonical headers.
- **Session summaries** auto-generated.
- **Audit trail** cascades into GAP_REPORT_v2.1.md.

---

## 10. Governance & Compliance
- **Compliance Appendices** → requirements tracked separately, referenced here.
- **Preservation Checklist** → ensures long-term operability.
- **Session Summary** → produced automatically per session.

---

## 11. Operational Rules
- **Playbook = Canonical.**
- **Cascading updates** → All changes cascade into Playbook and other docs. On new file creation, tie content into Playbook and cascade into Feature List, Compliance, GAP, etc.
- **No placeholders** → Deliverables must be production-ready.
- **ZIP Audit** → All packages audited for completeness and stubs before release.
- **TOC Requirement** → All major docs must include a Table of Contents at the top with internal links.
- **User Guide Requirement** → A comprehensive `USER_GUIDE_v2.1.md` must exist. If missing, generate from Playbook + Quickstart + Compliance_User.

---

## 12. Accessibility Roadmap — WCAG 2.2 AAA
SilentStacks references **WCAG 2.2** as canonical roadmap.  
- Actively reference: https://www.w3.org/TR/WCAG22/  
- Traceability: Success Criteria → Feature map maintained in Selector_Map_v2.1.md.  
- **Audit**: Automated + human, every release.  
- **Conformance**: AAA target, no exceptions.

---

## 13. References
- **RULES_CHARTER.md** — canonical governance
- **Selector_Map_v2.1.md** — element → feature traceability
- **GAP_REPORT_v2.1.md** — identifies open issues
- **Worst_Case_Scenarios.md** — defines system recovery paths

