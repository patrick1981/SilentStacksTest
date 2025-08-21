# SilentStacks — Rules Charter (v2.1)

This document defines the canonical rules followed for SilentStacks documentation, packaging, and stability.

---

## 🔑 Core
- **Playbook is canonical** → It is the single source of truth. All other docs must defer to it.
- **Cascading updates** → When one doc changes, the Playbook gets patched automatically. On **new file creation**, content must be tied into the Playbook and cascaded into all relevant docs (Feature List, Compliance, GAP Report, etc.).
- **No placeholders** → All deliverables must be complete, production-ready, and testable.

---

## ⚡ P0 Stability (Always Engaged)
1. Cascading updates across docs.
2. Auto-package & restart if memory/session fails.
3. Generate cumulative session summary (until today, then daily).
4. Always enforce P0 benchmarks:
   - Bulk operations
   - Throttling
   - Headers uniformity
   - Linkout pivot
   - AAA accessibility

---

## 📂 Documentation & Packaging
- **Uniformity & completeness** → Every doc must be fully populated, no empty stubs unless flagged.
- **Session continuity** → Summaries and manifests saved at each stage.
- **ZIP packages** → Must include ready-to-drop HTML/JS and authored PDFs (Quickstart, Upkeep, Developer Guide).
- **Post-ZIP Audit** → After creating any documentation package, immediately **audit for stubs and completeness** before release.
- **TOC Requirement** → All major docs (Playbooks, Developer Guides, Executive Summary, Compliance Appendices, Feature Lists, Quickstart, GAP Reports, User Guides, etc.) must include a **Table of Contents (TOC)** at the top.
- **User Guide Requirement** → A comprehensive `USER_GUIDE_v2.1.md` must exist. If missing, generate from Playbook + Quickstart + Compliance_User.

---

## 🎨 UI/UX
- **UI consistency** → If a linkout or field appears in the card, it must also appear in the table (and vice versa).
- **AAA accessibility** → Proper labeling, contrast, ARIA roles, captions, and keyboard navigation are mandatory.
- **Help/FAQ** → Must exist as a panel/button and be updated when features change.
- **WCAG 2.2 AAA Roadmap** → Use the official W3C WCAG 2.2 standard as the accessibility roadmap. Do **not** assume; **actively reference** the spec and Quick Reference on every change and release. Maintain a Success Criteria → Feature **traceability map** and **continually audit** (automated + human). Links:
  - WCAG 2.2 (normative): https://www.w3.org/TR/WCAG22/
  - How to Meet WCAG (Quick Reference): https://www.w3.org/WAI/WCAG22/quickref/
  - Understanding Conformance: https://www.w3.org/WAI/WCAG22/Understanding/conformance

---

## 🛠 Development Practices
- **Monolithic first** → Build/test stable monoliths before modularization.
- **Operational AI handoff** → Docs and changelogs structured so another AI/dev can pick up without gaps.
- **Cascading diffs** → Always track stubs vs. substantial docs, and generate manifests for audits.
