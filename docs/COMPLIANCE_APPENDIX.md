📎 `COMPLIANCE_APPENDIX.md` (Developer edition)


# Compliance Appendix (Developer)

## Where is Canonical?
WCAG 2.2 AAA and Security matrices live in **PLAYBOOK_v2.1.md**.

## Dependency Integrity
- Keep a **local** `dependencies.js`.  
- On release, compute SHA256 and store it in release notes.  
  - Example (macOS/Linux): `shasum -a 256 dependencies.js`
