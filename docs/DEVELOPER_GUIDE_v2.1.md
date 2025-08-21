# SilentStacks Developer Guide v2.1

**Status:** Reference Guide  
**Last Updated:** 2025-08-21  

---

## Table of Contents
1. [Overview](#1-overview)  
2. [Development Principles](#2-development-principles)  
3. [Monolithic Build](#3-monolithic-build)  
4. [Service Worker](#4-service-worker)  
5. [Accessibility](#5-accessibility)  
6. [Handoff & Maintenance](#6-handoff--maintenance)  
7. [References](#7-references)
8. [Documentation Layout](#8-documentation-layout)

Developers must reference and maintain the canonical file structure:

- Playbook → truth source
- Rules Charter → governance rules
- Dev Guide → coding & build standards
- Worst Case Scenarios → failure conditions
- Feature List → feature matrix
- GAP Report → audit baselines
- User Guide → workflows
- Exec Summary → leadership orientation
- Quickstart → setup
- Upkeep → maintenance
- Compliance_User → WCAG traceability


Developers must reference and maintain the canonical file structure:

- Playbook → truth source
- Rules Charter → governance rules
- Dev Guide → coding & build standards
- Worst Case Scenarios → failure conditions
- Feature List → feature matrix
- GAP Report → audit baselines
- User Guide → workflows
- Exec Summary → leadership orientation
- Quickstart → setup
- Upkeep → maintenance
- Compliance_User → WCAG traceability
  

---

## 1. Overview
This guide provides developer-facing instructions for SilentStacks.  
It complements the [Playbook](./Playbook_v2.1.md), [Rules Charter](./RULES_CHARTER.md), and [User Guide](./COMPREHENSIVE_USER_GUIDE_v2.1.md).  

---

## 2. Development Principles
- **Monolithic-first**: Build/test monoliths before modularization.  
- **No placeholders**: All code must be production-ready.  
- **Accessibility**: All commits reviewed against [WCAG 2.2 AAA](https://www.w3.org/TR/WCAG22/).  
- **Cascading updates**: When rules/docs change, cascade into [Playbook](./Playbook_v2.1.md).  

---

## 3. Monolithic Build
- Keep a full monolithic HTML/JS build as the operational baseline.  
- Modularization may occur later but only after monolith stability.  
- Service Worker and IndexedDB integration must be validated in monolith first.  

---

## 4. Service Worker
- Cache-first strategy with network fallback.  
- Background sync for failed requests.  
- Error handling logged into developer console and [GAP report](./GAP_REPORT_v2.1.md).  

---

## 5. Accessibility
- Use semantic HTML, ARIA roles, captions.  
- Test with screen readers (NVDA, JAWS).  
- Verify against [WCAG 2.2 AAA Success Criteria](https://www.w3.org/WAI/WCAG22/quickref/).  
- Maintain a Success Criteria → Feature traceability map in [Selector_Map_v2.1.md](./Selector_Map_v2.1.md).  

---

## 6. Handoff & Maintenance
- All docs and code must be structured for AI + human developers.  
- Provide session summaries and changelogs for continuity.  
- On new dev cycles, review [RULES_CHARTER.md](./RULES_CHARTER.md) before starting.  

---

## 7. References
- [Playbook_v2.1.md](./Playbook_v2.1.md)  
- [RULES_CHARTER.md](./RULES_CHARTER.md)  
- [Selector_Map_v2.1.md](./Selector_Map_v2.1.md)
- [Handoff Guide](./HANDOFF_GUIDE.md)
- [Preservation Checklist](./PRESERVATION_CHECKLIST.md)

---
## 8. Documentation Layout

Developers must reference and maintain the canonical file structure:

- Playbook → truth source
- Rules Charter → governance rules
- Dev Guide → coding & build standards
- Worst Case Scenarios → failure conditions
- Feature List → feature matrix
- GAP Report → audit baselines
- User Guide → workflows
- Exec Summary → leadership orientation
- Quickstart → setup
- Upkeep → maintenance
- Compliance_User → WCAG traceability

