###08-12-2025
---

## 1. Major Decisions Made

* **2025-08-12** — Pivoted to **v2.1** after catastrophic v2.0 failure (CORS + SW instability). Context: v2.0 could not initialize due to CT.gov enrichment blockers.
* **2025-08-12** — **CT.gov enrichment removed**; replaced with NCT **linkout-only** approach. Context: Public proxies unsafe, CORS restrictions irrecoverable.
* **2025-08-13** — **Bulk cutoff set at 50,000 rows**. Context: Bulk uploads exceeding this caused browser instability.
* **2025-08-13** — **Rate limit capped at ≤2/sec PubMed API calls**. Context: Aligns with NCBI recommendations, prevents blocks.
* **2025-08-14** — **Checkpoint/resume implemented** using IndexedDB. Context: To recover from tab crash or network outage mid-bulk job.
* **2025-08-15** — **“n/a” normalization rule** established. Context: Dirty rows must not be silently dropped.
* **2025-08-16** — **Commit Clean vs Commit All** workflow created. Context: Librarians must choose between ingesting validated rows only or all rows flagged dirty.
* **2025-08-16** — **Exports made round-trip safe**. Context: CSV re-imports had been failing; enforced strict headers + normalization.
* **2025-08-17** — **Accessibility AAA elevated to P0**. Context: Risk of adoption failure if only AA compliance achieved.
* **2025-08-18** — **Canonical headers locked**. Context: Prevent schema drift between exports, UI, and docs.
* **2025-08-19** — **Worst-Case Scenarios explicitly canonicalized**. Context: Previously drifted in modeling phase; 40-case library created.
* **2025-08-20** — **Playbook unified with GAP Report**. Context: Documentation drift; GAP embedded into Playbook with TOC.
* **2025-08-21** — **Conference + peer-review deliverables mandated**. Context: Leadership/communications requirement.

---

## 2. P0 Failures

| Timestamp  | Failure                               | Root Cause                                              | Corrective Action                              | Evidence Snippet                                                                                                  |
| ---------- | ------------------------------------- | ------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 2025-08-12 | Catastrophic v2.0 failure             | CORS restrictions blocked CT.gov enrichment; SW brittle | Pivot to v2.1, remove enrichment, linkout only | “v2.0 catastrophic failure: CORS blocked CT.gov enrichment … resulted in emergency flush and unrecoverable data.” |
| 2025-08-12 | Service Worker instability            | Cache corruption, offline unreliable                    | Simplified SW to cache app shell only          | “Service Worker instability broke offline caching … corrective: SW simplified.”                                   |
| 2025-08-13 | Browser crashes in bulk ops           | No bulk limits enforced                                 | Enforced ≤50k cutoff                           | “Bulk ops unbounded … enforced 50k cutoff.”                                                                       |
| 2025-08-14 | Job loss on network crash             | No persistence of mid-run state                         | IndexedDB checkpoint/resume added              | “Job loss on crash/network … implemented IndexedDB checkpoint.”                                                   |
| 2025-08-15 | Dirty rows dropped                    | System omitted malformed entries                        | Enforced `"n/a"` rule, dirty export            | “Dirty rows silently dropped … forced ‘n/a’ fillers.”                                                             |
| 2025-08-16 | Ambiguous commit semantics            | No clear way to commit partially clean sets             | Commit Clean vs Commit All added               | “Commit logic unclear … added Commit Clean vs Commit All.”                                                        |
| 2025-08-16 | CSV round-trip failures               | Header drift, blanks not preserved                      | Canonical headers, strict NLM format enforced  | “Exports not re-import safe … enforced canonical headers.”                                                        |
| 2025-08-17 | Accessibility below AAA               | Only partial AA achieved                                | Elevated AAA compliance to P0                  | “Accessibility below AAA … elevated AAA to P0.”                                                                   |
| 2025-08-18 | Header schema drift                   | Different docs and exports misaligned                   | Locked canonical headers                       | “Header drift … locked canonical headers.”                                                                        |
| 2025-08-19 | Worst-case scenarios non-canonical    | Spec drifted; lost in modeling                          | Created Worst-Case doc, Playbook linkage       | “Worst-case scenarios … created dedicated doc.”                                                                   |
| 2025-08-20 | Documentation drift (Playbook vs GAP) | GAP not in sync with Playbook                           | Unified doc; embedded GAP                      | “Docs drift … unified Playbook and embedded GAP.”                                                                 |
| Various    | Unrecoverable chat loss               | Session overwrote bulk ops details                      | Declared unrecoverable                         | “Unrecoverable due to deleted chat.”                                                                              |

---

## 3. Canonical Updates

| Timestamp  | Canonical Update                          | Trigger/Context              | Evidence Snippet                                        |
| ---------- | ----------------------------------------- | ---------------------------- | ------------------------------------------------------- |
| 2025-08-12 | Playbook v2.1 draft created               | v2.0 failure triggered reset | “Created Playbook v2.1 draft; pivot baseline declared.” |
| 2025-08-13 | Bulk cutoff and rate limit rules codified | Crash + API block risk       | “Added bulk cutoff (50k) + rate limit rules.”           |
| 2025-08-14 | IndexedDB checkpoint documented           | Crash loss issue             | “Checkpoint/resume added to baseline.”                  |
| 2025-08-15 | “n/a” rule + dirty export                 | Librarian data integrity     | “n/a rule, dirty-row export documented.”                |
| 2025-08-16 | Commit modes + round-trip export          | User workflow clarity        | “Commit Clean vs All + round-trip export added.”        |
| 2025-08-17 | AAA accessibility matrix added            | Adoption risk                | “Accessibility AAA matrix inserted.”                    |
| 2025-08-18 | Canonical headers declared                | Prevent drift                | “Canonical headers declared.”                           |
| 2025-08-19 | Worst-Case doc created, linked            | Drift in modeling phase      | “Worst-case scenarios doc … Playbook linked.”           |
| 2025-08-20 | GAP embedded in Playbook                  | Docs drift                   | “GAP Report embedded in Playbook.”                      |
| 2025-08-21 | Communication deliverables drafted        | Conference prep              | “Peer-review article + case study prepared.”            |

---

## 4. Catastrophic / Systemic Events

| Time/Phase        | Event                                                          | Impact                                       | Action Taken                                                               |
| ----------------- | -------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| 2025-08-12 (v2.0) | **Catastrophic failure**: All gates failed, enrichment blocked | Emergency flush, unrecoverable data          | Pivot to v2.1; declared v2.0 archived                                      |
| 2025-08-19        | **Systemwide P0 failure during modeling**                      | Canonical headers & ops lost across sessions | Rebuilt baseline ops doc; locked headers; created Worst-Case canonical doc |

---

## 5. Summary

This session documented **critical P0 failures** largely arising from **v2.0’s collapse** under CT.gov CORS restrictions and brittle service worker caching. The impact was systemic: v2.0 was abandoned as unrecoverable, with an emergency pivot to **v2.1**.

Failures primarily fell into two categories:

* **Production-level instability** (CORS, service worker crashes, browser crashes during bulk).
* **Modeling/documentation drift** (loss of canonical headers, bulk ops logic, worst-case scenarios).

Corrective actions included: enforcing **hard cutoffs (50k)**, **rate limits (≤2/sec)**, implementing **checkpoint/resume**, elevating **WCAG AAA accessibility to P0**, and creating a **canonical Worst-Case Scenarios doc**. Governance was stabilized by embedding the **GAP Report into the Playbook**, ensuring documentation cannot drift again.

The outcome: SilentStacks v2.1 is now **demo-stable** with resilient bulk handling, dirty data preservation, and accessibility compliance. Production readiness remains pending final audits of the service worker, storage safety, and accessibility gaps.

---

✅ This file should be saved as:
`SilentStacks_Failure_Records.md`

Would you like me to now **package this together with the Playbook, GAP Report, and Worst-Case Scenarios doc into a single ZIP** so it’s GitHub-ready?



###8-19-2025
---

## 1. Major Decisions Made

* **2025-08-19** — Deprecated **SilentStacks v2.0** due to CT.gov API CORS failures; pivoted to NCT linkouts via PubMed .
* **2025-08-20** — Formalized **P0 Scope for v2.1**: offline-first client, ≤50k bulk cap, throttling ≤2/sec, AAA accessibility, canonical headers, and commit flows .
* **2025-08-21** — Added **Gate 0 Operational Stability Safety**: brakes slam on memory degradation, OOM, or browser lag; requires rehydration + upload audit before continuing .
* **2025-08-21** — Declared **Performance Degradation → Wind-Down trigger**; flush state, block new ops, stabilize before safe stop .
* **2025-08-22** — Approved **CLEAN v2 docs package**: Playbook v2.1 fully fleshed out (214 lines) but supporting docs collapsed into stubs .
* **2025-08-23** — Established **Ready-to-Migrate model**: all deliverables (monolith, app.min.js, authored PDFs, AAA compliance, manifest) required before 2.1 beta .

---

## 2. P0 Failures

| Timestamp  | Failure                            | Root Cause                                  | Corrective Action                                        | Evidence Snippet                                          |
| ---------- | ---------------------------------- | ------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| 2025-08-19 | CT.gov enrichment failed           | CORS restrictions                           | Pivot to PubMed-derived NCT linkouts only                | “Removed direct ClinicalTrials.gov API calls due to CORS” |
| 2025-08-19 | v2.0 crash: modules failed to load | RequestManager blocked by CT.gov enrichment | Deprecated v2.0, reset baseline to 1.2, advanced to v2.1 | “Deprecated due to CT.gov CORS issues and instability”    |
| 2025-08-21 | Playbook\_v2.1 stub (2 lines)      | Incomplete doc packaging                    | CLEAN v2 repack with 214-line Playbook                   | “Playbook\_v2.1 … only a line or two long”                |
| 2025-08-21 | Gate 0 not tied to memory/lag      | Canon omission                              | Canon updated: OOM/lag → Gate 0 halt                     | “Explicit memory watchdog → Wind-Down trigger”            |
| 2025-08-21 | Emergency ZIP missing              | Packaging skipped in Wind-Down              | Canon updated: ZIP creation mandatory before flush       | “ZIP not delivered … Move ZIP packaging to Gate 0”        |
| 2025-08-21 | Flush not executed                 | Emergency branch aborted                    | Canon updated: Flush mandatory final step                | “Flush never executed … enforce strict sequencing”        |
| 2025-08-21 | Stub docs passed audit             | Stub detection missing                      | Fix: enforce stub scanner in Gate 2                      | “File audits passed on stubs/incomplete docs”             |
| 2025-08-23 | Migration ZIP incomplete           | Missing monolith, app.min.js, PDFs          | Block migration until all present                        | “Missing … index.html, app.min.js, authored PDFs”         |

---

## 3. Canonical Updates

| Timestamp  | Canonical Update                                                              | Trigger/Context                     | Evidence Snippet                                         |
| ---------- | ----------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------- |
| 2025-08-19 | Removed CT.gov API; NCT linkouts only                                         | v2.0 → v2.1 pivot                   | “CT.gov API enrichment → Removed (CORS)”                 |
| 2025-08-20 | Enforced strict P0 scope (bulk ≤50k, throttling, AAA, headers, offline-first) | Drafting Playbook v2.1              | “P0 Scope … 50k hard cutoff, ≤2/sec, AAA accessibility”  |
| 2025-08-21 | Gate 0: brakes slam on OOM/lag                                                | Detected canon gap                  | “Explicit memory watchdog → Wind-Down trigger”           |
| 2025-08-21 | Flush mandatory in Wind-Down                                                  | Emergency path skipped flush        | “Flush never executed … enforce strict sequencing”       |
| 2025-08-21 | Auto-log all P0 failures in Playbook                                          | Failures required user intervention | “P0 failures always recorded in Playbook”                |
| 2025-08-21 | Repair loop capped (10 iterations / 5 min)                                    | Infinite auto-repair risk           | “Auto-repair loop risk … Canon updated”                  |
| 2025-08-23 | Migration readiness model canonicalized                                       | Pre-beta packaging prep             | “This doc becomes canonical upon P0 packaging execution” |

---

## 4. Catastrophic / Systemic Events

| Time/Phase                       | Event                                     | Impact                                               | Action Taken                                                        |
| -------------------------------- | ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| v2.0 rollout (2025-08-19)        | CT.gov CORS crash cascaded                | All modules failed to load; system unusable          | Deprecated v2.0, pivoted to NCT linkouts                            |
| Wind-Down Emergency (2025-08-21) | Emergency ZIP skipped, flush not executed | System failed to preserve continuity; artifacts lost | Canon updated: ZIP mandatory at Gate 0, flush mandatory final step  |
| Session OOM / lag (2025-08-21)   | No brakes triggered                       | Risk of modeling in dirty state                      | Canon updated: OOM/lag = Gate 0 trigger; rehydration required       |

---

## 5. Summary

SilentStacks **v2.0 collapsed under production load** when CT.gov enrichment broke due to CORS, cascading into a complete module initialization failure. This forced a **hard pivot in v2.1** toward PubMed-derived NCT linkouts, offline-first design, capped bulk ops, strict throttling, and AAA accessibility. The v2.0 catastrophe is logged as a systemic **production P0 failure**, unrecoverable without pivot.

In v2.1, the dominant failures were **documentation and gating**: Playbooks and Feature Lists shipped as stubs, emergency ZIPs failed to generate, flushes were skipped, and Gate 0 stability wasn’t initially tied to memory/lag conditions. These were caught through multiple audits and corrected in canon with mandatory ZIP packaging at Gate 0, stub scanning in Gate 2, auto-logging of P0s, and stricter repair/flush enforcement.

By late August 2025, the project reached a **stabilized baseline under v2.1**, with canonical rules hardened around migration readiness: all deliverables (monolith, app.min.js, authored PDFs, manifest, AAA compliance) must be present before beta. The outcome of these failures is a stronger canon, but also clear evidence that **v2.1 remains pre-beta until artifacts align with canon**.



#### 8-20-2025

#### 1. Major Decisions Made

- **2025-08-20** — **Drop `.xlsx` support (CSV-only)**  
  *Context:* Tech-agnostic requirement to avoid lock-in; codified in Rules Charter.  

- **2025-08-20** — **Fix Gate 4 sequencing**  
  *Context:* Playbook approval and printing moved to Step 1 of Gate 4; prevents regressions from bouncing back to Gate 3.  

- **2025-08-21** — **CT.gov linkout-only policy**  
  *Context:* CORS issues and compliance concerns; enrichment attempts blocked; decided to only provide static anchor links.  

- **2025-08-22** — **Require live TOCs and cross-links in all docs**  
  *Context:* Skeleton docs were unacceptable; canon requires navigable TOCs and cascaded cross-references.  

- **2025-08-22** — **Restrict enrichment to PubMed + CrossRef**  
  *Context:* CT.gov enrichment deprecated; PubMed and CrossRef stable; confirmed as sole metadata sources.  

- **2025-08-23** — **Remove all CT.gov/NCT code, UI, and schema elements**  
  *Context:* Residual CT.gov references persisted even after linkout-only stance; full strip mandated.  

- **2025-08-23** — **Adopt simple, CORS-safe fetch rules**  
  *Context:* Browser enforced CORS on CT.gov; solution was to standardize on “simple” requests (GET + Accept, no forbidden headers; CrossRef contact via `?mailto=`).  

- **2025-08-23** — **Canonicalize 10-column schema (no NCT)**  
  *Context:* To stabilize export and avoid schema drift.  

- **2025-08-23** — **Canonize Bulk Parser**  
  *Context:* Bulk pastes produced dirty “dumpster fire” data; parser required for normalization, validation, deduplication, confidence scoring, quarantine.  

- **2025-08-23** — **Approve v2.0 Feature List and v1.2→v2.0 Delta Table**  
  *Context:* To clearly communicate changes to leadership/stakeholders.  

---

#### 2. P0 Failures

| Timestamp | Failure | Root Cause | Corrective Action | Evidence Snippet |
|-----------|---------|------------|------------------|------------------|
| 2025-08-22 | CT.gov API CORS block | CT.gov v1 endpoints retired; missing `Access-Control-Allow-Origin`; returned 404. | Stopped using CT.gov for enrichment; eliminated NCT usage. | *“Cross-Origin Request Blocked: … Status code: 404.”* |
| 2025-08-22 | Residual CT.gov/NCT references | First pass edits didn’t fully strip HTML/JS references. | Deep removal across HTML/JS/SW → `index_nctless.html`, `app_nctless.min.js`, `service-worker_clean.js`. | *“oi. you were supposed to remove CT.gov data in these files. I still see it.”* |
| 2025-08-23 | Syntax error in minified JS | Over-aggressive regex substitution broke `app.min.js`. | Rebuilt from clean original; reapplied targeted removals. | *“Uncaught SyntaxError: bad class member definition app.min.js:35:4096”* |
| 2025-08-23 | CSP warning | Malformed CSP meta from earlier edits. | Restored valid CSP in updated HTML. | *“Content-Security-Policy: Ignoring unknown option 'none' index_clean.html”* |
| 2025-08-23 | Export schema drift | Table/export still expected NCT field after removal. | Schema locked to 10 canonical headers. | *“strip out the NCT fields, we don't need them anymore.”* |
| 2025-08-23 | Dirty data ingestion risk | Bulk paste parser missing; free-text polluted fields. | Canonized Bulk Parser with validation + quarantine. | *“Worst case scenario for data parsing. Mixed dirty data that needs to be parsed…”* |

---

#### 3. Canonical Updates

| Timestamp | Canonical Update | Trigger/Context | Evidence Snippet |
|-----------|------------------|-----------------|------------------|
| 2025-08-20 | CSV-only (remove `.xlsx`) | User insisted project be tech agnostic; codified in Rules Charter. | *“remove xslx capability throughout project. This should be tech agnostic. Put this in rules charter.”* |
| 2025-08-20 | Gate 4 sequencing fix | Previous canon had Playbook printing misplaced. | *“two canonical changes: 1. Playbook printing and approval step 1 in gate 4. …”* |
| 2025-08-21 | CT.gov linkout-only | Inline enrichment attempts failed; fallback to static linkouts. | *“We ripped out the CT.gov enrichment in favor of linkout due to CORS issues, correct?”* |
| 2025-08-22 | Live TOCs and cross-links required | User saw missing cross-refs; declared canon. | *“did you link up the tocs? … I want all docs to have live links. Ensure that is canon.”* |
| 2025-08-22 | PubMed + CrossRef only | Decision to avoid unstable CT.gov APIs. | *“Well - we're going to have to rip out the clinicaltrials.gov functionality. Instead grab the NCT number from the PMID fetch …”* |
| 2025-08-23 | CT.gov/NCT full removal | Residual references persisted; full strip canonized. | *“I want it gone. Strip it away and amend dependent content.”* |
| 2025-08-23 | CORS rules | Needed safe fetch patterns for PubMed/CrossRef. | *“Adopt simple CORS-safe fetch rules.”* |
| 2025-08-23 | 10-column schema | Table/export mismatch discovered. | *“what headers to you have … PMID | DOI | Title … Confidence”* |
| 2025-08-23 | Bulk Parser canonized | Bulk ops risk; added confidence scoring/quarantine. | *“Give me a 2.0 feature list … Bulk parser for dirty/mixed data …”* |
| 2025-08-23 | P0 Benchmarks codified | User asked explicitly: “Tell me the P0 benchmarks.” | *“P0 Benchmarks: Data Flow Integrity, Bulk Ops, Offline-First, Accessibility, Security, Performance, Export.”* |
| 2025-08-23 | v2.0 feature list + delta accepted | Needed baseline record for leadership. | *“give me a 2.0 feature list” … “Yes” … produced v1.2→v2.0 delta table.* |

---

#### 4. Catastrophic / Systemic Events

| Time/Phase | Event | Impact | Action Taken |
|------------|-------|--------|--------------|
| Modeling → Packaging (Aug 22) | **CT.gov cascade failure** | All CT.gov-based enrichment blocked at source → multiple module load failures; UI banners showed modules stuck at 0/13 loaded. | Abandoned CT.gov; linkout-only rule; then total removal. |
| Packaging (Aug 23) | **JS corruption during edits** | Overbroad regex rewrites broke `app.min.js`. | Rebuilt clean bundle; applied targeted patching. |
| Documentation (Aug 22) | **Skeleton docs discovered** | User confronted missing TOCs/cross-refs; risk of broken canon. | New rule: all docs must have TOCs + cross-refs; cascade enforced. |

---

#### 5. Summary

Between **Aug 20–23, 2025**, SilentStacks experienced a mix of **modeling-phase P0 failures** and **packaging-phase corrective actions**. The most disruptive failures came from **CT.gov deprecation and CORS enforcement**: enrichment modules failed to load, producing initialization failures and broken UI references. This triggered a major policy shift: first to **linkout-only**, and ultimately to **complete removal of CT.gov/NCT functionality**.

The transition from **v1.2 → v2.0** marked a systemic cleanup. Failures such as residual CT.gov references, schema drift, CSP misconfigurations, and broken JS were corrected through deep code edits and canon updates. A new **10-column schema** was adopted, and a **bulk parser** was canonized to defend against dirty/mixed data in bulk operations.

For **v2.1 and beyond**, the outcome is a leaner, more robust platform: PubMed and CrossRef only, CORS-compliant fetches, strict AAA accessibility, and hardened data ingestion. Failures were caught during modeling and packaging, not production, but their resolution reshaped the canon: CSV-only policy, Gate 4 sequencing fix, mandatory live TOCs, and a complete redefinition of enrichment scope. These changes, locked into the Playbook, now form the baseline for all future audits and builds.
