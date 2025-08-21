# SilentStacks — Rules Charter (v2.1)

This document defines the canonical rules followed for SilentStacks documentation, packaging, and stability.

---

## Table of Contents
- [🔑 Core](#-core)
- [⚡ P0 Stability](#-p0-stability-always-engaged)
- [📂 Documentation & Packaging](#-documentation--packaging)
- [🎨 UI/UX](#-uiux)
- [🛠 Development Practices](#-development-practices)

---

## 🔑 Core
- **[Playbook](./Playbook_v2.1.md) is canonical** → It is the single source of truth. All other docs must defer to it.
- **Cascading updates** → When one doc changes, the [Playbook](./Playbook_v2.1.md) gets patched automatically. On **new file creation**, content must be tied into the [Playbook](./Playbook_v2.1.md) and cascaded into all relevant docs ([Developer Guide](./DEVELOPER_GUIDE_v2.1.md), [Compliance](./COMPLIANCE_APPENDIX.md), [GAP Report](./GAP_REPORT_v2.1.md), etc.).
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
   - [AAA accessibility](https://www.w3.org/TR/WCAG22/)

---

## 📂 Documentation & Packaging
- **Uniformity & completeness** → Every doc must be fully populated, no empty stubs unless flagged.
- **Session continuity** → Summaries and manifests saved at each stage.
- **ZIP packages** → Must include ready-to-drop HTML/JS and authored PDFs ([Quickstart](./QUICKSTART_v2.1.md), [Upkeep](./UPKEEP_v2.1.md), [Developer Guide](./DEVELOPER_GUIDE_v2.1.md)).
- **Post-ZIP Audit** → After creating any documentation package, immediately **audit for stubs and completeness** before release.
- **TOC Requirement** → All major docs ([Playbooks](./Playbook_v2.1.md), [Developer Guides](./DEVELOPER_GUIDE_v2.1.md), [User Guides](./COMPREHENSIVE_USER_GUIDE_v2.1.md), [Compliance Appendices](./COMPLIANCE_APPENDIX.md), [GAP Reports](./GAP_REPORT_v2.1.md), [Quickstart](./QUICKSTART_v2.1.md), etc.) must include a **Table of Contents (TOC)** at the top.
- **User Guide Requirement** → A comprehensive [USER_GUIDE_v2.1.md](./COMPREHENSIVE_USER_GUIDE_v2.1.md) must exist. If missing, generate from [Playbook](./Playbook_v2.1.md) + [Quickstart](./QUICKSTART_v2.1.md) + [Compliance_User](./COMPLIANCE_APPENDIX_User.md).

---

## 🎨 UI/UX
- **UI consistency** → If a linkout or field appears in the card, it must also appear in the table (and vice versa).
- **[AAA accessibility](https://www.w3.org/TR/WCAG22/)** → Proper labeling, contrast, ARIA roles, captions, and keyboard navigation are mandatory.
- **Help/FAQ** → Must exist as a panel/button and be updated when features change.
- **[WCAG 2.2 AAA](https://www.w3.org/TR/WCAG22/) Roadmap** → Use the official [W3C WCAG 2.2 standard](https://www.w3.org/TR/WCAG22/) as the accessibility roadmap. Do **not** assume; **actively reference** the spec and [Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) on every change and release. Maintain a Success Criteria → Feature **traceability map** in [Selector_Map_v2.1.md](./Selector_Map_v2.1.md) and **continually audit** (automated + human). Links:
  - [WCAG 2.2 (normative)](https://www.w3.org/TR/WCAG22/)
  - [How to Meet WCAG (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/)
  - [Understanding Conformance](https://www.w3.org/WAI/WCAG22/Understanding/conformance)

---

## 🛠 Development Practices
- **Monolithic first** → Build/test stable monoliths before modularization.
- **Operational AI handoff** → Docs and changelogs structured so another AI/dev can pick up without gaps (see [Handoff Guide](./HANDOFF_GUIDE.md)).
- **Cascading diffs** → Always track stubs vs. substantial docs, and generate manifests for audits (see [Preservation Checklist](./PRESERVATION_CHECKLIST.md)).
