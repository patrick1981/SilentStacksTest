# Compliance Appendix (Developer Edition)
**Run:** 2025-08-20 10:05 UTC

## Contents
- AAA accessibility baseline
- Security baseline
- Canonical headers: `Urgency | Docline # | PMID | Citation | NCT Link | Patron e-mail | Fill Status`
- Acceptance & verification
- Change Log

## WCAG 2.2 AAA Conformance Matrix (v2.1)

| Guideline | Success Criterion | Level | Status |
|-----------|-------------------|-------|--------|
| 1.4.6 | Contrast (Enhanced) | AAA | ✅ Met – ≥7:1 (≥4.5:1 large) |
| 1.4.8 | Visual Presentation | AAA | ⚠ Pending – preferences panel (spacing/width) |
| 1.4.9 | Images of Text (No Exception) | AAA | ✅ Met – no text-in-images |
| 2.1.3 | Keyboard (No Exception) | AAA | ✅ Met – full keyboard operability |
| 2.2.3 | No Timing | AAA | ✅ Met – no timeouts |
| 2.3.2 | Three Flashes | AAA | ✅ Met – no flashing content |
| 2.4.8 | Location | AAA | ⚠ Pending – breadcrumb indicators |
| 2.4.9 | Link Purpose (Link Only) | AAA | ✅ Met – self-describing links |
| 2.4.10 | Section Headings | AAA | ✅ Met – semantic structure |
| 2.4.12 | Focus Not Obscured (Enhanced) | AAA | ⚠ Pending – sticky header testing |
| 2.4.13 | Focus Appearance | AAA | ✅ Met – thick, high-contrast outline |
| 3.3.9 | Accessible Authentication (Enhanced) | AAA | N/A – no authentication |
| 1.3.6 | Identify Purpose | AAA | ✅ Met – ARIA + autocomplete |
| 3.3.7 / 3.3.8 | Redundant Entry / Consistent Help | A/AA | ⚠ Pending – persistent Help affordance |
| 1.2.6 / 1.2.8 / 1.2.9 | Sign Language / Media Alternatives / Audio-only (Live) | AAA | N/A – no media |

## Security Conformance Matrix (v2.1)

| Risk | Control | Status |
|------|---------|--------|
| XSS | Escape HTML/attributes; sanitize inputs | ✅ Met |
| API Injection | Regex validation; URL-encode params | ✅ Met |
| CORS Misuse | CT.gov API calls disabled; linkout only | ✅ Met |
| Data Leakage | Exports normalized; `"n/a"` enforced | ✅ Met |
| Storage Safety | IndexedDB cleanup of malformed blobs | ⚠ Pending (audit) |
| Dependency Integrity | Pin libraries; SRI hashes for CDN | ⚠ Pending |

## Acceptance & Verification
- Attach current matrices to GAP Report
- Lighthouse + manual SR for accessibility
- Security spot-checks for XSS/API injection/storage/deps

## Change Log
- 2025-08-20 10:05 UTC — Synced with modular docs, matrices, worst-cases, headers.
