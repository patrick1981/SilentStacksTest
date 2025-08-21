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

---

## 1. Overview
This guide provides developer-facing instructions for SilentStacks.  
It complements the Playbook, Rules Charter, and User Guide.  

---

## 2. Development Principles
- **Monolithic-first**: Build/test monoliths before modularization.  
- **No placeholders**: All code must be production-ready.  
- **Accessibility**: All commits reviewed against WCAG 2.2 AAA.  
- **Cascading updates**: When rules/docs change, cascade into Playbook.  

---

## 3. Monolithic Build
- Keep a full monolithic HTML/JS build as the operational baseline.  
- Modularization may occur later but only after monolith stability.  
- Service Worker and IndexedDB integration must be validated in monolith first.  

---

## 4. Service Worker
- Cache-first strategy with network fallback.  
- Background sync for failed requests.  
- Error handling logged into developer console and GAP report.  

---

## 5. Accessibility
- Use semantic HTML, ARIA roles, captions.  
- Test with screen readers (NVDA, JAWS).  
- Verify against WCAG 2.2 AAA Success Criteria.  
- Maintain a Success Criteria → Feature traceability map in `Selector_Map_v2.1.md`.  

---

## 6. Handoff & Maintenance
- All docs and code must be structured for AI + human developers.  
- Provide session summaries and changelogs for continuity.  
- On new dev cycles, review `RULES_CHARTER.md` before starting.  

---

## 7. References
- [Playbook_v2.1.md](./Playbook_v2.1.md)  
- [RULES_CHARTER.md](./RULES_CHARTER.md)  
- [Selector_Map_v2.1.md](./Selector_Map_v2.1.md)  
