# GAP_REPORT_v2.1
**Run:** 2025-08-20 10:05 UTC

## ✅ Met
- P0 scope captured (bulk, throttling, linkout pivot, headers, AAA goals)
- `"n/a"` fill policy enforced
- Dirty-only export path defined
- Security baselines present (XSS + API injection)

## ⚠ Pending
- Preferences panel (1.4.8) for spacing/width
- Breadcrumb/location cues (2.4.8)
- Focus not obscured under sticky headers (2.4.12)
- Consistent Help affordance (3.3.7/3.3.8)
- IndexedDB storage audit; SRI hashes for CDN deps

## ❌ Out
- CT.gov API calls in any form

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

## Acceptance Checks
- AAA + Security matrices verified
- Worst-case scenarios simulated
- Exports validated (clean-only & full) with `"n/a"` preserved
- UI checkpoint/resume tested under close/reopen
