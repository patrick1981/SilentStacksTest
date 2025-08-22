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
12. [Modes of Operation](#12-modes-of-operation)
13. [Accessibility Roadmap — WCAG 2.2 AAA](#13-accessibility-roadmap--wcag-22-aaa)
14. [References](#14-references)
15. [Worst Case Scenarios](#15-worst-case-scenarios)
16. [Documentation Layout](#16-documentation-layout)

---

## 1. Introduction

SilentStacks is an offline-first, accessible interlibrary loan (ILL) and request management platform built for healthcare and academic libraries.
This Playbook is the **canonical operational guide**. All other documents ([Developer Guide](./DEVELOPER_GUIDE_v2.1.md), [User Guide](./COMPREHENSIVE_USER_GUIDE_v2.1.md), [Compliance](./COMPLIANCE_APPENDIX.md), [GAP Report](./GAP_REPORT_v2.1.md), etc.) defer to this file.

---

## 2. Core Objectives

* **Client-only execution:** No server-side persistence; IndexedDB + LocalStorage only.
* **Healthcare IT alignment:** HIPAA safe (no PHI), WCAG 2.2 AAA accessibility.
* **Metadata enrichment:** PubMed, CrossRef, ClinicalTrials.gov (linkout only).
* **Reliability:** Operates under unreliable networks with retry logic.
* **Uniformity:** Canonical headers and schema enforced globally.

---

## 3. P0 Benchmarks

* **Bulk operations** up to 50,000 rows.
* **API throttling:** PubMed ≤ 2/sec.
* **Headers:** Canonical 7-column schema (Urgency, Docline #, PMID, Citation, NCT Link, Patron E-mail, Fill Status).
* **Linkout pivot:** PMID/DOI/NCT consistent across table + card view.
* **AAA accessibility** compliance validated every release.

---

## 4. Data Architecture

* **IndexedDB** → request storage, checkpointing.
* **LocalStorage** → preferences + UI state.
* **Service Worker** → offline cache + background sync.
* **Cutoff:** 50,000 rows/job.

---

## 5. Bulk Operations

* **CSV & Paste** accepted.
* **Validation** against canonical headers.
* **Dirty data:** flagged `"n/a"`, filterable, exportable.
* **Retry Queue** with exponential backoff.
* **UI Feedback:** ARIA live regions + AAA contrast.

---

## 6. Metadata Enrichment

* **PubMed (ESummary/EFetch)** primary source.
* **CrossRef** fallback for DOI/title.
* **ClinicalTrials.gov:** linkout only (CORS limits).
* **Mismatch detection** flagged in UI.

---

## 7. UI & Accessibility

* **Semantic HTML5**, ARIA roles, captions.
* **Keyboard-first nav** (skip links, focus outlines).
* **High-contrast theme**.
* **Help/FAQ** panel maintained.

---

## 8. Offline Support

* **Service Worker** cache-first strategy w/ fallback.
* **Background Sync** queues requests for later retry.
* **IndexedDB Sync** ensures no data loss on disconnect.

---

## 9. Export & Reporting

* **CSV/Excel** export w/ canonical headers.
* **Variants:** clean-only or full dataset.
* **Round-trip guarantee:** exports reimport safely.
* **Audit trail** cascades into GAP report.

---

## 10. Governance & Compliance

* **Compliance Appendices** → requirements tracked, referenced here.
* **Preservation Checklist** → ensures long-term operability.
* **Session Summary** → auto-generated every wind-down.
* **Peer-review Conference Report** now mandatory output.

---

## 11. Operational Rules

* **Playbook = Canonical.**
* **Cascading updates** → all docs cascade from Playbook.
* **No placeholders** → deliverables must be production-ready.
* **TOC Requirement** → all docs must include TOCs.
* **ZIP/Print Audit** → line counts + file sizes printed at wind-down.
* **Concurrency** → yesterday + today’s edits merged, 100% synch required.

---

## 12. Modes of Operation

SilentStacks runs in two modes:

1. **Modeling Mode**

   * Path: `docs/modeling/`
   * Docs-only packaging (Markdown).
   * Used for modeling new policies/features.

2. **Development Mode**

   * Path: root `/docs/` + client app.
   * Live HTML/JS/CSS execution.
   * Includes API fetches, offline-first runtime.

---

## 13. Accessibility Roadmap — WCAG 2.2 AAA

* **Contrast ≥ 7:1** for normal text.
* **Keyboard navigation** enforced.
* **ARIA labeling + skip links** included.
* **Audit**: automated + manual every release.
* **Conformance target: AAA** without exception.

---

## 14. References

* [RULES\_CHARTER.md](./RULES_CHARTER.md) — governance & rules
* [Selector\_Map\_v2.1.md](./Selector_Map_v2.1.md) — accessibility traceability
* [Worst\_Case\_Scenarios.md](./WORST_CASE_SCENARIOS.md) — 40 explicit failure cases
* [Developer Guide](./DEVELOPER_GUIDE_v2.1.md)
* [User Guide](./COMPREHENSIVE_USER_GUIDE_v2.1.md)
* [Quickstart](./QUICKSTART_v2.1.md)
* [Handoff Guide](./HANDOFF_GUIDE.md)
* [Conference\_Report.md](./CONFERENCE_REPORT.md) — session problems + solutions

---

## 15. Worst Case Scenarios

See full detail → [Worst\_Case\_Scenarios.md](./Worst_Case_Scenarios.md)

---

## 16. Documentation Layout

* `Playbook_v2.1.md` → canonical.
* `RULES_CHARTER_v2.1.md` → governance.
* `DEV_GUIDE_v2.1.md` → developer rules.
* `WORST_CASE_SCENARIOS_v2.1.md` → P0 failures + mitigations.
* `FEATURE_LIST_v2.1.md` → feature matrix.
* `GAP_REPORT_v2.1.md` → compliance audit.
* `USER_GUIDE_v2.1.md` → end-user workflows.
* `EXEC_SUMMARY_v2.1.md` → leadership overview.
* `QUICKSTART_v2.1.md` → setup.
* `UPKEEP_v2.1.md` → maintenance SOP.
* `COMPLIANCE_USER_v2.1.md` → WCAG + accessibility.
* `CONFERENCE_REPORT.md` → canonical session report (peer-review quality).

---

Do you want me to now **print the modeling files under `docs/modeling/`** so you see their current state in the wind-down package?
