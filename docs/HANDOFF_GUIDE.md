# Handoff Guide

## Start Here
Read **[PLAYBOOK_v2.1.md](./Playbook_v2.1.md)** (canonical) first.

## Process
- Use [Selector_Map_v2.1.md](./Selector_Map_v2.1.md) for wiring selectors.  
- Don't fork the enrichment engine; only adjust selectors.  
- On PRs: run [Preservation Checklist](./PRESERVATION_CHECKLIST.md) + embed updated [GAP REPORT](./GAP_REPORT_v2.1.md) into [Playbook](./Playbook_v2.1.md).

## New Chat Prompt (paste for next maintainer)
"You are inheriting SilentStacks v2.1 (4‑file runtime: index.html, app.min.js, dependencies.js, sw.js).  
[Playbook](./Playbook_v2.1.md) is canonical; maintain [WCAG 2.2 AAA](https://www.w3.org/TR/WCAG22/) and security matrices; preserve [worst‑case contracts](./Worst_Case_Scenarios.md).  
Use [Selector_Map_v2.1.md](./Selector_Map_v2.1.md); do not fork enrichment logic. Run [GAP](./GAP_REPORT_v2.1.md) after each iteration."

## Related Documentation
- [Developer Guide](./DEVELOPER_GUIDE_v2.1.md)
- [Rules Charter](./RULES_CHARTER.md)
- [Upkeep Guide](./UPKEEP_v2.1.md)
- [User Guide](./COMPREHENSIVE_USER_GUIDE_v2.1.md)
