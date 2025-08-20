# Developer Guide (v2.1)
**Run:** 2025-08-20 10:05 UTC

## File Tree
```
SilentStacks/
├── index.html
├── /css/
│   └── style.css
├── /js/
│   └── app.min.js
├── /documentation/
│   ├── PLAYBOOK_v2.1.md
│   ├── GAP_REPORT_v2.1.md
│   ├── QUICKSTART_v2.1.md
│   ├── UPKEEP_v2.1.md
│   ├── DEVELOPER_GUIDE_v2.1.md
│   ├── COMPLIANCE_APPENDIX.md
│   ├── COMPLIANCE_APPENDIX_User.md
│   ├── HANDOFF_GUIDE.md
│   ├── PRESERVATION_CHECKLIST.md
│   └── Selector_Map_v2.1.md
```

## Architecture & Contracts
- Client-only app: IndexedDB for data; localStorage for prefs
- v1.2 UI contract immutable
- Canonical headers: `Urgency | Docline # | PMID | Citation | NCT Link | Patron e-mail | Fill Status`
- NCT linkouts only; no CT.gov API

## Implementation Rules
- Sanitize/escape all dynamic HTML
- Validate & URL-encode all identifiers before calls
- Never leave blanks; write `"n/a"` for missing data
- Keep adapter/selectors in sync with Selector Map

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

## Worst-Case Scenarios (Explicit)
- **Dirty bulk paste:** Mixed PMIDs/DOIs/NCTs + malformed strings → parse, queue, flag dirty rows, force `"n/a"`; continue queue.
- **Extreme bulk:** >50k rows → reject with clear message (cutoff), suggest chunking.
- **Network loss / tab close:** Checkpoint in IndexedDB; resume on reopen.
- **Export/import loop:** Clean-only & full exports must re-import without corruption; dirty flags preserved.
- **Titles-only dump w/ typos:** Fuzzy match; below threshold remains dirty (no silent fill).
- **CSV junk:** Commas in quotes, Excel artifacts → robust parser, fallback regex.

## Acceptance (Dev)
- Update GAP Report matrices per PR
- Verify exports round-trip cleanly
- Test keyboard-only paths & screen reader output
