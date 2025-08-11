# SilentStacks Tech Maintenance (v2.5)
**Audience:** IT / maintainers

## Files & Layout
- Monolith: `SilentStacks_v2.5_monolith.html`
- Reports: `RELEASE_NOTES.md`, `GAP_REPORT.md`, `CHANGELOG.md`
- Docs: `documentation/QuickStart.md`, `documentation/TechMaintenance.md`, `documentation/DevelopersGuide.md`

## Deploy
- **GitHub Pages:** place the monolith at repo root or `/documentation/`.
- **Local/air-gapped:** open file directly; for SW caching use a local HTTP server.

## Maintenance
- **Cache refresh:** hard reload (Ctrl/Cmd+Shift+R). If needed, bump SW cache name and rebuild.
- **Backup:** copy the monolith + export JSON from the Export tab.
- **Config knobs:** rate limits, theme default, MeSH limit (Settings or config block).

## Troubleshooting
- No network: keep working; queue drains when back online.
- API errors: check rate limits; retry with API keys if available.
- A11Y: verify focus order/contrast; see `RELEASE_NOTES.md`.

## What changed in this build
- (Agent appends notes here automatically)
