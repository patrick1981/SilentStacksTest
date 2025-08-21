Perfect — thank you for grounding this.
We’ll lock the name (`Playbook_v2.1.md`) and pathing (`docs/modeling`).
I’ve folded in all of the **canonical rules, concurrency gates, baseline ops, headers, guardrails, external references**.

Here is the **full amended Playbook** — **no truncation**:

---

# FILE: `docs/modeling/Playbook_v2.1.md`

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
14. [Worst Case Scenarios](#14-worst-case-scenarios)
15. [Documentation Layout](#15-documentation-layout)
16. [Concurrency Gates](#16-concurrency-gates)
17. [Modeling Files Index](#17-modeling-files-index)


---

## 1. Introduction

SilentStacks is an offline-first, accessible interlibrary loan (ILL) and request management platform built for healthcare and academic libraries.
This Playbook is the **canonical operational guide**.
All other documents ([Developer Guide](../DEVELOPER_GUIDE_v2.1.md), [User Guide](../COMPREHENSIVE_USER_GUIDE_v2.1.md), [Compliance](../COMPLIANCE_APPENDIX.md), [GAP Report](../GAP_REPORT_v2.1.md), etc.) defer to this file.

---

## 2. Core Objectives

* **Client-only execution:** No server-side persistence; IndexedDB + LocalStorage only.
* **Healthcare IT alignment:** HIPAA safe (no PHI), [AAA accessibility](https://www.w3.org/TR/WCAG22/).
* **Metadata enrichment:** [PubMed](https://pubmed.ncbi.nlm.nih.gov/), [CrossRef](https://www.crossref.org/), [ClinicalTrials.gov](https://clinicaltrials.gov/).
* **Reliability:** Operates under unreliable networks with retry logic.
* **Uniformity:** Headers, request schema, linkouts consistent across system.

---

## 3. P0 Benchmarks

These define minimum viable stability:

* **Bulk operations** up to 50,000 rows.
* **Throttling:** PubMed ≤ 2 requests/sec.
* **Headers:** Canonical 7 headers, enforced in order (see Operational Rules).
* **Linkout pivot:** PMID/DOI/NCT linkouts consistent across card + table.
* **AAA accessibility:** [WCAG 2.2 AAA](https://www.w3.org/TR/WCAG22/) roadmap, continuous audit.

---

## 4. Data Architecture

* **IndexedDB** → request storage, bulk imports.
* **LocalStorage** → preferences, UI state.
* **Service Worker** → offline cache + background sync.
* **Cutoff:** 50,000 rows/job.

---

## 5. Bulk Operations

* **CSV & Paste** accepted.
* **Validation** against canonical headers.
* **Retry Queue** for failures with exponential backoff.
* **UI Feedback:** ARIA live regions + AAA contrast.

---

## 6. Metadata Enrichment

* **[PubMed](https://pubmed.ncbi.nlm.nih.gov/)** (ESummary/EFetch).
* **[CrossRef](https://www.crossref.org/)** fallback for DOI/title.
* **[ClinicalTrials.gov](https://clinicaltrials.gov/)** for NCT ID.
* **Mismatch detection** → flagged in UI.

---

## 7. UI & Accessibility

* **Semantic HTML5**, ARIA roles, captions.
* **Keyboard-first nav** (skip links, focus outlines).
* **High-contrast theme**.
* **Help/FAQ** panel maintained.

---

## 8. Offline Support

* **Service Worker** handles cache-first strategy with network fallback.
* **Background Sync** queues requests for later retry.
* **IndexedDB Sync** ensures no data loss during disconnects.

---

## 9. Export & Reporting

* **CSV export** with canonical headers.
* **Session summaries** auto-generated.
* **Audit trail** cascades into [GAP\_REPORT\_v2.1.md](../GAP_REPORT_v2.1.md).

---

## 10. Governance & Compliance

* **[Compliance Appendices](../COMPLIANCE_APPENDIX.md)** → requirements tracked separately, referenced here.
* **[Preservation Checklist](../PRESERVATION_CHECKLIST.md)** → ensures long-term operability.
* **Session Summary** → produced automatically per session.

---

## 11. Operational Rules

* **Playbook = Canonical.**
* **Cascading updates** → All changes cascade into Playbook and other docs.
* **No placeholders** → Deliverables must be production-ready.
* **ZIP Audit** → All packages audited for completeness and stubs before release.
* **TOC Requirement** → All major docs must include a Table of Contents.
* **User Guide Requirement** → A comprehensive `USER_GUIDE_v2.1.md` must exist.
* **Canonical Table Headers** (7, fixed order):

  1. **Urgency**
  2. **Docline #**
  3. **PMID**
  4. **Citation**
  5. **NCT Link**
  6. **Patron E-mail**
  7. **Fill Status**

> Rule: Never reorder or rename headers. All exports/imports mirror schema.
> Missing/invalid values = `"n/a"`.
**Modeling files live under** `docs/modeling/` and are required artifacts for **Model Mode**.
**Model vs. Dev linkage:** Modeling specs in `docs/modeling/` must be reflected in the running system as described by the Developer Guide; drift is a Gate 4 failure.


---

## 12. Accessibility Roadmap — WCAG 2.2 AAA

SilentStacks references **[WCAG 2.2](https://www.w3.org/TR/WCAG22/)** as canonical roadmap.

* Actively reference WCAG spec.
* Traceability: Success Criteria → [Selector\_Map\_v2.1.md](../Selector_Map_v2.1.md).
* **Audit**: Automated + human, every release.
* **Conformance**: AAA target, no exceptions.

---

## 13. References

* [RULES\_CHARTER.md](../RULES_CHARTER.md)
* [Selector\_Map\_v2.1.md](../Selector_Map_v2.1.md)
* [GAP\_REPORT\_v2.1.md](../GAP_REPORT_v2.1.md)
* [Worst\_Case\_Scenarios.md](../Worst_Case_Scenarios.md)
* [Developer Guide](../DEVELOPER_GUIDE_v2.1.md)
* [User Guide](../COMPREHENSIVE_USER_GUIDE_v2.1.md)
* [Quickstart](../QUICKSTART_v2.1.md)
* [Handoff Guide](../HANDOFF_GUIDE.md)
* [P0 Packaging & Stability Suite](../P0_Packaging_and_Stability_Suite_v2.1.md)
* [Operational Stability](../Operational_Stability.md)
* [Resume Points](../Resume_Points.md)
* [Modeling Index](../modeling/Modeling_Index.md)
* [Modeling Rules](../modeling/Modeling_Rule_v2.1.md)


---

## 14. Worst Case Scenarios

Full list in → [Worst\_Case\_Scenarios.md](../Worst_Case_Scenarios.md).

---

## 15. Documentation Layout

SilentStacks documentation is organized into **core canonical files**:

* `Playbook_v2.1.md` → Canonical.
* `RULES_CHARTER_v2.1.md` → Governance and rules.
* `DEV_GUIDE_v2.1.md` → Developer practices.
* `WORST_CASE_SCENARIOS_v2.1.md` → 40 explicit P0 cases.
* `FEATURE_LIST_v2.1.md` → Functional feature matrix.
* `GAP_REPORT_v2.1.md` → Compliance audit.
* `USER_GUIDE_v2.1.md` → End-user workflows.
* `EXEC_SUMMARY_v2.1.md` → Leadership orientation.
* `QUICKSTART_v2.1.md` → Setup reference.
* `UPKEEP_v2.1.md` → Maintenance SOPs.
* `COMPLIANCE_USER_v2.1.md` → Accessibility trace.

---

## 16. Concurrency Gates

### Opening Gate — Concurrency Lock

* Load **latest GitHub copy** of Playbook at Spin-Up.
* Enforce **Single Edition Rule** (only one active edition).
* All linked docs must match declared version.

### Closing Gate — Drift Prevention

* Confirm **100% concurrency**: today’s edits + yesterday’s docs + GitHub master branch.
* Print **line counts + file sizes** (audit). No stubs/skeletons.
* Only one ZIP export permitted.
* `RESUME.json` must be created to enforce continuation.
* If concurrency fails → automatic replay of session edits vs. GitHub until resolved.
* `docs/modeling/*` files are included in the print-audit (line counts + file sizes + link validation); any failure halts packaging until remediated.

---

## 17. Modeling Files Index

**Canonical path:** `docs/modeling/`  
These files define the system in Model Mode and are treated as P0 inputs for Dev Mode.

- `Modeling_Index.md` — entry point & map of modeling docs (required, with TOC)
- `High_Level_Model.md` — system runtime model (client-only, offline-first)
- `Bulk_Ops_Model_v2.1.md` — paste/upload, queueing, 50k cap, retry
- `API_Integration_Model_v2.1.md` — PubMed/CrossRef integration (CT.gov linkout only)
- `JSON_Ingestion_Model_v2.1.md` — schema & flattening rules
- `Day_to_Day_Ops_Model_v2.1.md` — operator workflows & roles
- `WCS_Categorical_Handling_Summary_v2.1.md` — worst-case category responses
- `Modeling_Rule_v2.1.md` — naming, storage, audit requirements (≥1 KB + TOC)

**Gate expectations (applies via Gate 4 – Concurrency Firewall):**
- Every file above **exists**, has a **TOC**, and is **≥ 1 KB** (no stubs/shorties).
- Links between modeling docs are **relative** and resolve (no dead links).
- Changes made in `docs/modeling/` are reflected in Dev Mode (via `DEVELOPER_GUIDE_v2.1.md`) before packaging; otherwise **Gate 4 blocks**.
