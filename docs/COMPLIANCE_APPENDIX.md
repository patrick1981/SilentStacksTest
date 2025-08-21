# Compliance Appendix

## Purpose
This appendix tracks compliance requirements relevant to SilentStacks and its deployment in healthcare and library IT environments.

---

### HIPAA / PHI Safeguards
- SilentStacks does not collect, store, or process Protected Health Information (PHI).
- Data fields are limited to bibliographic identifiers (PMID, DOI, NCT) and requestor contact information.
- Ensure no patient-level identifiers are ingested.

### Accessibility (WCAG)
- SilentStacks follows **WCAG 2.2 AAA** roadmap.
- Traceability map maintained in [Selector_Map_v2.1.md](./Selector_Map_v2.1.md).
- Continuous audit required (automated + human).

### Security & Data Integrity
- IndexedDB storage encrypted at rest where browser supports it.
- Service Worker restricted to HTTPS scope only.
- CSP headers required for deployment.

---

### Canonical Rule
Compliance requirements cascade into the [Playbook](./Playbook_v2.1.md) and [Preservation Checklist](./PRESERVATION_CHECKLIST.md). Gaps logged in [GAP_REPORT_v2.1.md](./GAP_REPORT_v2.1.md).
