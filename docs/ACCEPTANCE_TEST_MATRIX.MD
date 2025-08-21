# Acceptance Test Matrix (v2.1)

## Bulk & Throttle
- [ ] 50k rows import completes; UI never locks
- [ ] PubMed requests never exceed 2/sec (instrumented)
- [ ] Network drop mid-job → checkpoint + resume

## Headers & Uniformity
- [ ] Non-canonical header map resolves common variants
- [ ] Unmapped header → fatal with actionable error
- [ ] Card/table linkouts identical (PMID/DOI/NCT)

## Enrichment & Conflicts
- [ ] PubMed primary success path (PMID → meta)
- [ ] CrossRef fallback on DOI/title
- [ ] Conflict badge shown when fields differ

## Storage & Export
- [ ] IDB quota nearing → user notice; safe degradations
- [ ] Export clean-only; export dirty-only
- [ ] Re-import exported dirty passes mapper

## Accessibility (WCAG 2.2 AAA)
- [ ] Focus not obscured; visible focus appearance
- [ ] Keyboard-only flows (add, bulk, resolve conflicts)
- [ ] Live regions announce progress/errors
- [ ] Contrast (enhanced) passes; captions/landmarks present

## Worst Case Samples
- [ ] Case 6: Network loss during 50k job → resume
- [ ] Case 23: API throttle engaged → banner + continue
- [ ] Case 39: API ban → backoff + pause + message
