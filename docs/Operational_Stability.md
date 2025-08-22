# Operational Stability (Docs Pipeline)

> **Status (Docs Pipeline):** **Mode:** docs-dev • **Gate:** G1 Pending • **Commit:** AUTO_3d5421c0093d7f58 • **Updated:** 2025-08-22T22:17:40Z

- Wrapper guard runs before any action
- Budgets rehydration for docs operations
- On risk → abort current slice, rollback, Safe‑Halt/backoff
- CT.gov linkout‑only policy is restated where applicable

## Documentation Pipeline – Performance Degradation (v2.1)

### Signals
- Connector lag or 5xx errors
- Slow manifest/audit runs
- Missing anchors or broken cross‑references

### Backoff & Queue (Docs)
- Enter read‑only mode for the docs pipeline
- Exponential backoff: 1s → 2s → 4s → 8s (max 60s)
- Queue audits until connector recovery

### Recovery Steps
1. Re‑list `docs/` to confirm SSOT integrity
2. Regenerate `MANIFEST_v2.1.csv`
3. Re‑run regression checks (anchors, cross‑refs)
4. Log degradation event in `AUDIT_REPORT.md`

### Boundaries
This procedure governs the documentation pipeline only. It does not control production app runtime stability.

Cross-References: [Spin-Up Procedure](Spin_Up_Procedure.md), [Wind-Down Procedure](Wind_Down_Procedure.md), [Emergency Procedures](Emergency_Procedures_Docs.md), [Operational Stability](Operational_Stability.md), [Packaging & Stability Suite](P0_Packaging_and_Stability_Suite_v2.1.md)