# SilentStacks Playbook v2.1 (Draft)

**Origin:** Forked from v2.0 on 2025-08-19  
**Status:** Draft — under active refactor.  
**Note:** All content from 2.0 has been carried forward in full.  
Overlaps, outdated items, and redundancies will be resolved during section reviews.  

---

## 1. Client-Side Data Architecture & Limits (NEW P0)

- **All operations client-side.** No server backend — storage via IndexedDB + localStorage.  
- **Hard Cutoff:** Max 50,000 rows in any bulk paste/upload. Beyond that → reject.  
- **Rate Limits:** PubMed calls throttled to ≤ 2/sec.  
  - 50k job worst case ≈ 7 hours (parallel + checkpointing will reduce wall time).  
- **Checkpointing:** Progress bar + session resume for long imports.  
- **Dirty Data Handling:**  
  - Highlight invalid/missing rows in color.  
  - “Commit Clean Only” → table only gets validated rows.  
  - “Commit All” → everything goes in, dirty rows flagged for later.  
- **Recovery Paths:**  
  - Export dirty-only rows for offline cleaning/re-import.  
  - Force filter by error color in table UI.  
- **Accessibility:** AAA compliance, light/dark/high contrast all P0.  

---

## 2. Add Request (Single Entry)

*(Carried forward from v2.0 with updates)*  
- User pastes PMID, DOI, or title → fetch metadata (PubMed/CrossRef).  
- Deduplicate DOI/PMID; cross-check consistency.  
- Librarian fills missing fields, applies tags.  
- Save → auto-committed to table + card view.  
- **UI Impact:** no DOM/CSS deviation from 1.2 contract. Only new status messaging, error badges, and theme awareness.  

---

## 3. Bulk Operations (Paste/Upload)

*(Carried forward + expanded from v2.0)*  
- Accept CSV, Excel paste, or raw text lists.  
- Normalize inputs → PMIDs, DOIs, Titles.  
- Metadata fetch with throttling + caching.  
- Edge Cases:  
  - Mixed valid/invalid identifiers.  
  - Titles-only with spelling errors/diacritics.  
  - Excel junk fields.  
  - Random free text.  
- Commit Path:  
  - Auto-commit obvious matches.  
  - Librarian confirms/edits the rest.  
  - “Commit Clean” vs “Commit All” toggle.  

---

## 4. Worst-Case Scenarios

- **Singletons:** Garbage PMID/DOI → fail gracefully, suggest search.  
- **Bulk:** 500k attempt → reject with message (50k cutoff).  
- **Network Loss:** Resume import where left off.  
- **Mixed identifiers:** Dirty rows flagged; export option offered.  
- **Doctor Email Dump:** DOIs + PMIDs + half-written titles. Bulk fetch normalizes, fills in NLM citations, librarian finalizes.  

---

## 5. Accessibility & Theming

- AAA baseline: color contrast, keyboard-only navigation, ARIA labeling.  
- Theme switching: light, dark, high-contrast.  
- Always reflected in cards, table, and modals.  

---

## 6. Exports & Interop

- Strict NLM citation format enforced.  
- Export paths: clean-only vs full dataset.  
- Dirty rows marked “n/a” instead of blanks.  
- CSV/Excel export re-import safe.  

---

## 7. Security & Storage

- Sanitization for all imports (escape HTML/scripts).  
- IndexedDB for large sets; localStorage only for state/config.  
- Error logging bounded (max 50).  

---

Here’s your **updated Playbook** with the just-discussed bulk paste / bulk upload functional spec merged into the current master, preserving all existing content and structure.

---

# SilentStacks – Master Playbook (v1.2 → v2.0)

**Merged:** 2025-08-12 14:45

**Repo URL:** [https://github.com/patrick1981/SilentStacksTest](https://github.com/patrick1981/SilentStacksTest)
**Primary branch:** main
**Working branch:** main (PR-only; no direct pushes)
**Review model:** Solo maintainer may self-merge after checklist + artifacts

> **LIVING DOCUMENT** — Update on every run.

## Baseline Declaration

* v1.2 UI is the contract. Keep IDs/classes/roles/tab markup.
* **Exception (approved 2025-08-12):** Minimal DOM additions allowed to meet v2.0 scope:

  * Add **NCT ID** + **NCT Title** fields in Add Request.
  * Add **MeSH** / **CT.gov** **chips** containers (cards/table/preview).
  * Document all additions (IDs, ARIA, screenshots).

## Deliverables

* Single-file monolith: `dist/SilentStacks_v2_monolith.html` (all inline, no CDNs).
* Release ZIP: monolith + `RELEASE_NOTES.md` + `GAP_REPORT_v2.0.md` + updated docs.

## Phased Roadmap

* **A — Hardening & Parity:** SW, error boundaries, exporters, no boot errors.
* **B — Enrichment & Cross-Pop:** PubMed/CrossRef/CT.gov, bulk paste/upload, ID cross-linking, MeSH ≤8.
* **C — A11y (WCAG 2.2 AAA):** Light default; Dark/HC optional; labels/roles/skip links/live regions.
* **D — Offline-First:** queue lookups/exports; retry on reconnect.
* **E — Search/Filter:** fuzzy + fielded; sortable table.
* **F — Intelligence:** synonyms, MeSH hierarchy, specialty detection, trends.
* **G — CT.gov Tagging:** sponsor type, phase, overall status chips (selectable).

## Data & Security

* Validators: PMID `^\d{6,9}$`, DOI `^10\.\d{4,9}/\S+$`, NCT `^NCT\d{8}$`.
* Sanitize inputs, escape all outputs; encode all identifiers; allow-list params.

---

## **Bulk Paste & Bulk Upload Requirements (v2.0)**

### Source of Truth

* **Single Request Engine:** `test.html` logic defines the enrichment flow for PMID → DOI/NCT → MeSH.
* **Bulk Flows:** Must reuse the same enrichment pipeline for every identifier.

### Supported Inputs

* **Bulk Paste (textarea):** mixed tokens (PMID, DOI, NCT) in any order.
* **Bulk Upload (file input):** `.txt`, `.csv`, `.json`.

### Token Recognition

* **PMID:** `\b\d{6,9}\b`
* **DOI:** `\b10\.[^\s"']+\b`
* **NCT:** `\bNCT\d{8}\b` (case-insensitive)

### Processing Contract (per item)

1. Route by type:

   * PMID → PubMed → (DOI?) → (NCT?) → MeSH
   * DOI  → CrossRef → (PMID?) → (NCT?) → MeSH
   * NCT  → ClinicalTrials.gov → (linked PMID?) → MeSH
2. Populate fields & chips via adapter selector map.
3. Prepend a row to Requests table.
4. Announce progress in `#ss-live`.
5. Rate limit \~2/sec; continue on errors.

### Parser Behavior

* **Bulk Paste:** delimiter-agnostic, deduplicate while preserving order.
* **TXT:** same as paste; regex extraction, dedup.
* **CSV:**

  * If headings exist, extract from recognized columns (`pmid`, `doi`, `nct` variants).
  * If no headings, fallback to regex extraction from all cells.
  * Mixed-type supported in one pass.
* **JSON:** accept `{"pmids":[...]}`, optional `{"dois":[],"ncts":[]}`, or array of objects with `pmid`/`doi`/`nct` keys.

### UX & Accessibility

* Use `aria-live="polite"` for batch progress.
* Disable initiating button during batch only.
* Do not overwrite user-entered values; merge MeSH into `#tags`.

---

## Tests (must pass)

* Single PMID with NCT case populates DOI, NCT, trial details, MeSH, adds row.
* Bulk Paste mixed identifiers processed in order, all rows added, no dup chips.
* TXT messy delimiters handled and deduped.
* CSV with headings uses designated columns; without headings uses fallback regex.
* JSON variants all parsed correctly.

---

## GAP REPORT

**Run date:** 2025-08-12 14:45
**Build:** monolith (hotpatched + NCT fields + chips preview)

### Summary

* ✅ SW gating; offline supported on https/localhost.

* ✅ Strict ID validators; bulk parser normalization/dedupe.

* ✅ PubMed EFetch DOI + MeSH (≤8) + NCT detection.

* ✅ CrossRef with DOI→PMID backfill.

* ✅ NCT ID + NCT Title fields.

* ✅ Chips preview container with keyboard-accessible chips.

* ✅ JSON/CSV export; NLM exporter helper.

* ⚠️ MeSH/CT chips render in preview only (cards/table hooks pending).

* ⚠️ Bulk update bindings incomplete.

* ⚠️ API injection prevention pass 1 done; needs tightening.

* ⚠️ AAA contrast verification pending.

* ❌ CT.gov tags in cards/table missing.

* ❌ Bulk update workflow unbound.

* ❌ Finalized documentation set missing.

---

Perfect. Here’s an **AI-compatible Selector Map Appendix** you can paste at the end of the Master Playbook. It’s written to be machine-readable and human-skim friendly, so multiple AI devs can follow the same contracts without stepping on each other.

---

# Appendix — Selector Map & Integration Contracts (AI-Compatible)

> **Purpose:** Single source of truth for wiring any UI to the **canonical enrichment engine** (from `test.html`) for both **Single Request** and **Bulk** flows.
> **Rule:** If your UI changes, **only update selectors**. Do **not** edit engine logic.

## A. Selector Map (JSON contract)

```json
{
  "$schema": "https://example.com/silentstacks/selector-map.schema.json",
  "version": "2.0",
  "notes": "Update ONLY selectors to match the current UI. Leave keys intact.",
  "buttons": {
    "lookup_pmid": "#lookup-pmid",
    "lookup_doi": "#lookup-doi",
    "lookup_nct": "#lookup-nct",
    "bulk_paste": "#bulk-paste-btn",
    "bulk_upload": "#bulk-upload-btn"
  },
  "inputs": {
    "pmid": "#pmid",
    "doi": "#doi",
    "nct": "#nct",
    "title": "#title",
    "authors": "#authors",
    "journal": "#journal",
    "year": "#year",
    "volume": "#volume",
    "pages": "#pages",
    "tags_text": "#tags",
    "patron": "#patron-email",
    "status": "#status",
    "priority": "#priority",
    "docline": "#docline"
  },
  "clinical_trials": {
    "phase": "#gl-phase",
    "status": "#gl-ct-status",
    "sponsor": "#gl-sponsor",
    "nct_title": "#gl-nct-title, #nct-title"
  },
  "chips": {
    "mesh": "#gl-chips, #mesh-chips, #nct-suggestion-chips"
  },
  "bulk": {
    "paste_textarea": "#bulk-paste-data",
    "upload_input": "#bulk-upload"
  },
  "table": {
    "requests_tbody": "#requests-table tbody"
  },
  "status_regions": {
    "live": "#ss-live",
    "pmid": "#pmid-status",
    "doi": "#doi-status",
    "nct": "#nct-status"
  }
}
```

### Reserved Keys (do not rename)

* `buttons.lookup_*`, `inputs.*`, `clinical_trials.*`, `chips.mesh`, `bulk.*`, `table.requests_tbody`, `status_regions.*`

---

## B. Engine Interface (must exist in global scope)

```ts
interface EnrichmentEngine {
  enrichPMID(pmid: string): Promise<UnifiedResult>;
  enrichDOI(doi: string): Promise<UnifiedResult>;
  enrichNCT(nct: string): Promise<UnifiedResult>;
}
```

**UnifiedResult (shape used by adapter)**

```ts
interface UnifiedResult {
  unified?: RecordShape;        // preferred
  pubmed?: RecordShape;         // fallback for PMID
  crossref?: RecordShape;       // fallback for DOI
  clinicalTrial?: TrialShape;   // fallback for NCT
  tags?: TagShape[];            // optional
  errors?: string[];            // optional
}

interface RecordShape {
  pmid?: string;
  doi?: string;
  nct?: string;
  title?: string;
  authors?: Array<string | { name?: string; family?: string; last?: string }>;
  journal?: string;
  year?: string | number;
  volume?: string;
  pages?: string;
  containerTitle?: string;  // alt journal
  publishedYear?: string | number; // alt year
  mesh?: Array<string | TagShape>;
  clinicalTrial?: TrialShape;
}

interface TrialShape {
  nctId?: string;
  title?: string;
  phase?: string;
  status?: string;
  sponsor?: string;
  enrollment?: string | number;
}

interface TagShape {
  name: string;
  type?: "mesh" | "keyword" | "trial" | "other";
}
```

**Adapter selection rule:** prefer `result.unified`, else `pubmed/crossref/clinicalTrial`, then normalize to `RecordShape`.

---

## C. Token Recognition (regex contract)

* PMID: `/\b\d{6,9}\b/`
* DOI: `/\b10\.[^\s"']+\b/`
* NCT: `/\bNCT\d{8}\b/i`

**CSV headings (case/space tolerant)**

* PMIDs: `pmid`, `pubmed id`, `pm_id`
* DOIs: `doi`
* NCTs: `nct`, `nct id`, `clinicaltrials id`

---

## D. Adapter Outcomes (idempotent behaviors)

**Single Request (PMID button)**

1. Validate PMID (6–9 digits).
2. Call `engine.enrichPMID`.
3. Populate: `title, authors, journal, year, volume, pages, doi, nct`.
4. Populate trial fields if present: `phase, status, sponsor`, and set `nct_title`.
5. Merge MeSH into `tags_text` (preserve user text; dedupe).
6. Render chips into `chips.mesh` (if present; no duplicates).
7. Prepend a row to `requests_tbody`:

   * urgency = `priority`; docline; pmid; citation (`Authors. Title. Journal. Year.`); patron; status.
8. Update status: `status_regions.pmid` → `"Done • NCT linked"` if trial found, else `"Done"`.
9. Mirror status to `status_regions.live` (aria-live polite).

**Single Request (DOI / NCT buttons)**

* Same as above, routed via `enrichDOI` or `enrichNCT`. For NCT, if article metadata is provided, also fill biblio.

**Bulk Paste**

* Read `bulk.paste_textarea` → tokenize (PMID/DOI/NCT) → **dedupe** while preserving order → queue @ \~2/sec → per item run the same enrichment → add rows + statuses; continue on errors.

**Bulk Upload**

* **TXT:** parse with regex (delimiter-agnostic).
* **CSV:** use headings if found; else regex across cells. Mixed types allowed in one file.
* **JSON:** accept `{ pmids:[], dois:[], ncts:[] }` or array of objects with `pmid/doi/nct`.
* After extraction: merge into a single queue (preserve first-seen order across types), dedupe per type, then process like paste.

---

## E. Error & Status Contract (for all flows)

**Field-level validation errors (don’t mutate other fields):**

* PMID invalid → `status_regions.pmid = "PMID must be 6–9 digits."`
* DOI empty → `status_regions.doi = "Enter DOI"`
* NCT invalid → `status_regions.nct = "Enter NCT########"`

**Engine/runtime errors (per item):**

* Show short message in the relevant status region and announce via `status_regions.live`.
* Do not clear previously filled values.
* Continue bulk queue after an item fails.

---

## F. Minimal Adapter Skeleton (AI-ready)

```html
<script>
(function(){
  const S = /* paste the JSON above & read as object here */;

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const setVal = (sel, v) => $$(sel).forEach(el => { if ('value' in el) el.value = v ?? ''; else el.textContent = v ?? ''; });
  const getVal = sel => { const el = $(sel); return el ? ('value' in el ? el.value : el.textContent) : ''; };
  const say = (sel, msg) => setVal(sel, msg);

  // Engine (global)
  const engine = new (window.PMIDEnrichmentPipeline || function(){ this.enrichPMID=async()=>({}); this.enrichDOI=async()=>({}); this.enrichNCT=async()=>({}); })({});

  const normAuthors = a => Array.isArray(a) ? a.map(x => x.name || x.family || x.last || x).join('; ') : (a || '');
  const toCitation = u => {
    const list = Array.isArray(u.authors) ? u.authors : [];
    const a = list.slice(0,3).map(x => x.family||x.last||x.name||x).filter(Boolean).join(', ') || (u.authors||'');
    const j = u.journal || u.containerTitle || '';
    const y = u.year || u.publishedYear || '';
    return [a, u.title || '', j, y].filter(Boolean).join('. ');
  };
  const dedupe = arr => Array.from(new Set(arr));

  function fillTrial(ct){
    if (!ct) return;
    setVal(S.clinical_trials.phase, ct.phase || '');
    setVal(S.clinical_trials.status, ct.status || '');
    setVal(S.clinical_trials.sponsor, ct.sponsor || '');
    if (ct.title) setVal(S.clinical_trials.nct_title, ct.title);
  }

  function renderChips(tags){
    if (!tags) return;
    const containers = $$(S.chips.mesh);
    if (!containers.length) return;
    const names = dedupe(tags.map(t => (typeof t === 'string' ? t : t.name)).filter(Boolean));
    containers.forEach(c => {
      // remove only auto-added chips
      c.querySelectorAll('[data-auto="true"]').forEach(x => x.remove());
      names.slice(0,8).forEach(n => {
        const chip = document.createElement('span');
        chip.className = 'chip tag-mesh';
        chip.dataset.auto = 'true';
        chip.textContent = n;
        c.appendChild(chip);
      });
    });
  }

  function mergeTagsText(existing, incoming){
    const cur = (existing || '').split(',').map(x=>x.trim()).filter(Boolean);
    const inc = (incoming || []).map(t => (typeof t === 'string' ? t : t.name)).filter(Boolean);
    return dedupe([...cur, ...inc]).join(', ');
  }

  function fillForm(u){
    setVal(S.inputs.title,   u.title || '');
    setVal(S.inputs.authors, normAuthors(u.authors) || u.authorString || '');
    setVal(S.inputs.journal, u.journal || u.containerTitle || '');
    setVal(S.inputs.year,    u.year || u.publishedYear || '');
    setVal(S.inputs.volume,  u.volume || '');
    setVal(S.inputs.pages,   u.pages || '');
    setVal(S.inputs.doi,     u.doi || '');
    const nctVal = u.nct || (u.clinicalTrial && u.clinicalTrial.nctId) || '';
    setVal(S.inputs.nct, nctVal);
    if (u.clinicalTrial) fillTrial(u.clinicalTrial);
    const merged = mergeTagsText(getVal(S.inputs.tags_text), (u.tags || u.mesh));
    setVal(S.inputs.tags_text, merged);
    renderChips(u.tags || u.mesh);
  }

  function addRow(u){
    const tb = $(S.table.requests_tbody);
    if (!tb) return;
    const tr = document.createElement('tr');
    const urgency = getVal(S.inputs.priority) || 'Normal';
    const docline = getVal(S.inputs.docline) || '';
    const pmid = u.pmid || u.PMID || '';
    const citation = toCitation(u);
    const patron = getVal(S.inputs.patron) || '';
    const status = getVal(S.inputs.status) || 'New';
    tr.innerHTML = `<td>${urgency}</td><td>${docline}</td><td>${pmid}</td><td>${citation}</td><td>${patron}</td><td>${status}</td>`;
    tb.prepend(tr);
  }

  async function route(token, kind){
    try{
      let res;
      if (kind === 'pmid') res = await engine.enrichPMID(token);
      else if (kind === 'doi') res = await engine.enrichDOI(token);
      else if (kind === 'nct') res = await engine.enrichNCT(token);
      const u = res?.unified || res?.pubmed || res?.crossref || (res?.clinicalTrial ? { clinicalTrial: res.clinicalTrial, nct: res.clinicalTrial.nctId } : {}) || {};
      fillForm(u); addRow(u);
      return true;
    } catch(e){
      console.error('Enrichment failed:', kind, token, e);
      return false;
    }
  }

  // Wire Single buttons
  $(S.buttons.lookup_pmid)?.addEventListener('click', async () => {
    const v = getVal(S.inputs.pmid).trim();
    if (!/^\d{6,9}$/.test(v)) return say(S.status_regions.pmid, 'PMID must be 6–9 digits.');
    say(S.status_regions.pmid, 'Looking up…');
    const ok = await route(v, 'pmid');
    say(S.status_regions.pmid, ok ? 'Done' : 'Failed');
  });
  $(S.buttons.lookup_doi)?.addEventListener('click', async () => {
    const v = getVal(S.inputs.doi).trim();
    if (!v) return say(S.status_regions.doi, 'Enter DOI');
    say(S.status_regions.doi, 'Looking up…');
    const ok = await route(v, 'doi');
    say(S.status_regions.doi, ok ? 'Done' : 'Failed');
  });
  $(S.buttons.lookup_nct)?.addEventListener('click', async () => {
    const v = getVal(S.inputs.nct).trim();
    if (!/^NCT\d{8}$/i.test(v)) return say(S.status_regions.nct, 'Enter NCT########');
    say(S.status_regions.nct, 'Looking up…');
    const ok = await route(v, 'nct');
    say(S.status_regions.nct, ok ? 'Done' : 'Failed');
  });

  // Bulk Paste
  $(S.buttons.bulk_paste)?.addEventListener('click', async () => {
    const ta = $(S.bulk.paste_textarea);
    if (!ta) return;
    const text = ta.value || '';
    const toks = text.match(/\b(NCT\d{8}|10\.[^\s"']+|\d{6,9})\b/gi) || [];
    const seen = new Set(), queue = [];
    for (const t of toks) {
      const token = t.trim();
      if (seen.has(token)) continue;
      seen.add(token);
      const kind = /^NCT/i.test(token) ? 'nct' : /^10\./.test(token) ? 'doi' : 'pmid';
      queue.push({ token, kind });
    }
    for (const {token, kind} of queue) {
      await route(token, kind);
      await new Promise(r=>setTimeout(r,500));
    }
  });

  // Bulk Upload
  $(S.buttons.bulk_upload)?.addEventListener('click', () => {
    const inp = $(S.bulk.upload_input);
    if (!inp || !inp.files || !inp.files[0]) return;
    const file = inp.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const text = (reader.result || '').toString();
      let tokens = [];
      if (/\.json$/i.test(file.name)) {
        try {
          const j = JSON.parse(text);
          const collect = (x) => Array.isArray(x) ? x : [];
          const pmids = collect(j.pmids).concat(Array.isArray(j)? j.map(o=>o.pmid).filter(Boolean):[]);
          const dois  = collect(j.dois).concat(Array.isArray(j)? j.map(o=>o.doi).filter(Boolean):[]);
          const ncts  = collect(j.ncts).concat(Array.isArray(j)? j.map(o=>o.nct).filter(Boolean):[]);
          pmids.forEach(x=>tokens.push({token:String(x), kind:'pmid'}));
          dois.forEach(x=>tokens.push({token:String(x), kind:'doi'}));
          ncts.forEach(x=>tokens.push({token:String(x), kind:'nct'}));
        } catch { /* fall back below */ }
      }
      if (!tokens.length && (/\.csv$/i.test(file.name) || /\.txt$/i.test(file.name))) {
        // Try CSV with headers
        const lines = text.split(/\r?\n/);
        const head = (lines[0] || '').toLowerCase();
        const hasHeader = /pmid|pubmed id|pm_id|doi|nct|clinicaltrials id/i.test(head);
        if (hasHeader) {
          const cols = head.split(/,|;|\t/).map(s=>s.trim());
          const idx = (names) => cols.findIndex(c => names.some(n => c.replace(/\s+/g,'') === n.replace(/\s+/g,'')));
          const pmidIdx = idx(['pmid','pubmedid','pm_id']);
          const doiIdx  = idx(['doi']);
          const nctIdx  = idx(['nct','nctid','clinicaltrialsid']);
          for (let i=1;i<lines.length;i++){
            const parts = lines[i].split(/,|;|\t/);
            if (pmidIdx>=0 && parts[pmidIdx]) tokens.push({token:parts[pmidIdx].trim(), kind:'pmid'});
            if (doiIdx>=0 && parts[doiIdx])   tokens.push({token:parts[doiIdx].trim(), kind:'doi'});
            if (nctIdx>=0 && parts[nctIdx])   tokens.push({token:parts[nctIdx].trim(), kind:'nct'});
          }
        }
        // Fallback regex across all text
        if (!tokens.length) {
          const all = text.match(/\b(NCT\d{8}|10\.[^\s"']+|\d{6,9})\b/gi) || [];
          tokens = all.map(t => ({ token: t, kind: /^NCT/i.test(t) ? 'nct' : /^10\./.test(t) ? 'doi' : 'pmid' }));
        }
      }
      // Dedupe while preserving first-seen order across types
      const seen = new Set(); const queue = [];
      for (const {token, kind} of tokens) {
        const key = kind + ':' + token.toUpperCase();
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push({token, kind});
      }
      for (const {token, kind} of queue) {
        await route(token.trim(), kind);
        await new Promise(r=>setTimeout(r,500));
      }
    };
    reader.readAsText(file);
  });
})();
</script>
```

---

## G. Acceptance Checklist (AI-runnable)

* [ ] **Single PMID** (trial case) populates DOI, NCT, `phase/status/sponsor`, merges MeSH, renders chips, adds Requests row, status “Done • NCT linked”.
* [ ] **Single DOI** backfills PMID (if available), fills biblio, adds row.
* [ ] **Single NCT** fills trial fields and biblio (when available), adds row.
* [ ] **Bulk Paste** mixed identifiers process in order, rows added, chips deduped, progress visible.
* [ ] **TXT Upload** with messy delimiters extracts all IDs and enriches.
* [ ] **CSV Upload** with `pmid/doi/nct` headings processes each column; without headings falls back to regex.
* [ ] **JSON Upload** supports both object and array forms.
* [ ] No UI regressions; only values/chips change; layout untouched.

---

## H. Collaboration Rules (multi-AI)

* **Single source of truth:** Engine from `test.html`. Don’t fork logic; only call it.
* **Only touch:** the selector map & adapter. Keep keys identical across PRs.
* **Conflicts:** If two PRs change selectors, **merge by union** of selectors (comma-separated selector lists are allowed).
* **Telemetry (optional):** Gate console logs behind `localStorage.debug === "true"` to aid remote AI debugging without user noise.

---

If you want, I can also generate a **standalone `selector-map.json`** file and a tiny loader that merges it into the adapter at runtime—handy when two AIs are iterating on different environments.

