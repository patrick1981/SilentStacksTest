# SilentStacks – Master Playbook (v1.2 → v2.0)

## Baseline Declaration (Read First)

**This repository’s file architecture is a direct replication of SilentStacks v1.2 and serves as the immutable baseline for v2.0 work.**

Agent requirements:
- Treat the current `index.html`, `assets/css/style.css`, and v1.2 JS as **read-only UI contract**.
- Do **not** alter DOM structure, IDs, classes, ARIA roles, tab markup, or the 3-step indicator without explicit approval.
- All v2.0 behavior must be implemented via new JS (adapters/api/exporters) without structural HTML/CSS changes.
- Any requested DOM/CSS change requires: (1) written rationale, (2) DOM/CSS diff, (3) before/after screenshots, (4) explicit approval.

**Baseline verification (must run once at start):**
1) Snapshot DOM of the live v1.2 UI (header, tabs, stepper, main panels).  
2) Compare current repo `index.html` against v1.2 reference; assert **0** structural diffs.  
3) Confirm CSS selectors for tablist, panels, inputs, buttons are unchanged.  
4) Save results to `RELEASE_NOTES.md` under “Baseline Verification”.


> **LIVING DOCUMENT**
> Agent Mode must treat this file as living. On every run:
> 1) Read it in full; 2) Append “What changed in this build” to each doc;
> 3) Update CHANGELOG/RELEASE_NOTES; 4) If rules/features evolve, update this playbook and summarize the change.

Source of truth for UI: https://patrick1981.github.io/SilentStacks/  
Reference bundle (optional): `SilentStacks_v1.2_UI_Reference.zip`

---

## 0) UI Contract (Non-Negotiable)

- **Do not add frameworks** (no Bootstrap/Tailwind/CDNs).
- **Do not change** existing IDs, classes, ARIA roles, tab markup, or the 3-step indicator.
- All new behavior via **JS only** (adapters/api/exporters). **No HTML restructuring.**
- If a referenced file is missing (e.g., `documentation.js`), create a **no-op stub**.
- **Default theme = Light**; Dark/High-Contrast only when explicitly toggled.
- **Fail the run** if DOM/CSS diffs alter IDs/classes/roles or tab/stepper structure.

---

## 1) Deliverables

- **One file:** `dist/SilentStacks_v2_monolith.html` (all CSS/JS **inlined**; **no external/CDN** refs).
- **Release ZIP:** `SilentStacks_Release.zip` containing:
  - the monolith
  - `RELEASE_NOTES.md` (with screenshots)
  - `GAP_REPORT.md` (see template below)
  - updated docs (`documentation/QuickStart.md`, `TechMaintenance.md`, `DevelopersGuide.md`)

---

## 2) Phased Roadmap (v1.2 → v2.0)

### Phase A — Hardening & Parity
1. Add **Service Worker** + cache manifest (offline after first visit).
2. Add error boundary + `aria-live` notifications.
3. Implement **exporters** behind existing buttons: JSON, CSV, **NLM**.
4. Tests: **no uncaught errors** on boot; keyboard traversal across tabs.

### Phase B — Enrichment & Cross-Population
1. API clients with rate limits (see §4).
2. **Bulk Paste / Bulk Upload** for mixed IDs (PMID/DOI/NCT).
3. **Cross-populate** identifiers; merge sources; record conflicts in `sourceConflicts`.
4. **MeSH auto-tagging** (≤5) rendered in existing tag UI.

### Phase C — Accessibility (WCAG 2.2 AAA)
1. Theme toggle (Light/Dark/HC) in **Settings**; persist choice.
2. Labels, names/roles/values; **7:1** contrast; skip links; visible focus.
3. Keyboard-only passes on: Add→Enrich→Save; Bulk Import→Export.

### Phase D — Offline-First
1. **Queue** lookups/exports while offline; retry on reconnect.
2. Verify offline boot; add cache integrity check (Diagnostics).

### Phase E — Search/Filter Upgrades
1. Keep **Fuse.js**; add **fielded** search + ranking (no UI changes).
2. Preserve table; add sort & filter bound to current headers/inputs.

---

## 3) Feature Checklist (v2.0 scope)

- Offline-first with SW + queue  
- Bulk import/export (paste/CSV/JSON) with dedupe/normalize  
- Cross-population between PMID, DOI, NCT  
- Enrichment: PubMed, CrossRef, ClinicalTrials.gov  
- MeSH auto-tags (≤5)  
- Advanced search/filter (fuzzy + fielded); sortable table  
- Status / Priority / Tags with color chips  
- NLM citation export  
- WCAG 2.2 AAA with Light/Dark/HC (**Light default**)  
- Security: sanitize inputs, escape renders (XSS-safe)  
- **No DOM/CSS drift** from v1.2

> **Future hooks only (leave UI unchanged in 2.0):**
> predictive synonyms; MeSH hierarchy (+★ for major topic); specialty detection; urgency heat map; simple trends; dynamic/custom fields import/export.

---

## 4) Data, API & Security

**Record model (keys used by table/cards/exports):**
```js
{
  id: "uuid",
  createdAt: "ISO",
  priority: "Low|Normal|High|Urgent",  // maps to "Urgency"
  docline: "string",                   // "Docline Number"
  identifiers: { pmid:"", doi:"", nct:"" },
  title:"", authors:"", journal:"", year:"", volume:"", issue:"", pages:"",
  citation:"",                         // NLM string for quick display/exports
  patronName:"", status:"New|In Progress|On Hold|Fulfilled|Canceled",
  mesh:[], tags:[], notes:"",
  sources:{ pubmed:{}, crossref:{}, clinicaltrials:{} },
  sourceConflicts:{}
}
````

**Rate limits:** PubMed ≤ **2/sec**, CrossRef ≤ **5/sec**, ClinicalTrials.gov **1/sec**
**Retries:** exponential backoff; **30s** timeouts; visible error messages
**Security:** sanitize all inputs; **disallow HTML** in text fields; **escape** output when rendering

---

## 5) Table & Data Rules (v2.0 hard requirements)

**Column order (exact):**
`Urgency | Docline Number | PMID | Citation | Patron Name | Status`

**Headings (exact strings):**
`Urgency`, `Docline Number`, `PMID`, `Citation`, `Patron Name`, `Status`

**Bulk Paste/Upload (PMID-only path):**

* Accept PMIDs only (commas / spaces / newlines)
* Enrich each via **PubMed**; if NCT is present/linked, also fetch **ClinicalTrials.gov**
* **Ignore empty tokens/rows** (no blank records)

**Empty/Blank fields:**

* **Import:** ignore blanks; never overwrite existing values with blanks
* **Export:** include columns; blanks output as **empty strings** (`""`) — never `null`/`undefined`

**Validation:**

* PMID is 6–9 digits
* Urgency ∈ {Low, Normal, High, Urgent} (default Normal)
* Status ∈ {New, In Progress, On Hold, Fulfilled, Canceled} (default New)

**Acceptance Tests:**

* Paste `12345678, 23456789` → 2 records enriched; CT.gov fetched when relevant; no blank rows created
* CSV with blank Patron/Docline: blanks ignored on import; existing values not cleared
* Header strings & order **exact**; sort & search work
* CSV/JSON export shows blanks as `""` (CSV) or omitted/empty string (JSON)

**Table Header Markup (must match):**

```html
<thead>
  <tr>
    <th><button data-sort="priority">Urgency</button></th>
    <th><button data-sort="docline">Docline Number</button></th>
    <th><button data-sort="identifiers.pmid">PMID</button></th>
    <th><button data-sort="citation">Citation</button></th>
    <th><button data-sort="patronName">Patron Name</button></th>
    <th><button data-sort="status">Status</button></th>
  </tr>
</thead>
```

**CSV helpers (Agent may use):**

```js
const CSV_HEADERS = ["Urgency","Docline Number","PMID","Citation","Patron Name","Status"];
function toRow(r){
  const h = {
    "Urgency": r.priority || "Normal",
    "Docline Number": r.docline || "",
    "PMID": r.identifiers?.pmid || "",
    "Citation": r.citation || "",
    "Patron Name": r.patronName || "",
    "Status": r.status || "New"
  };
  return CSV_HEADERS.map(k => `"${String(h[k]).replace(/"/g,'""')}"`).join(',');
}
function toCSV(records){ return [CSV_HEADERS.join(',')].concat(records.map(toRow)).join('\n'); }
```

---

## 6) Record Cards & MeSH Chips (no DOM restructuring)

**Where to render:**

* Dashboard “Recent Activity” (compact cards)
* Row expansion in “All Requests” via `<details>` inside existing table cell

**Card must include:**

* **Citation** (NLM string)
* **Clinical trial abstract snippet** (≤800 chars) if CT.gov data present
* **Color-coded status icon** (trial status)
* **Major keywords** (top MeSH + user tags) as **selectable, color-coded chips**

**Status → color mapping (via CSS vars):**

* Recruiting → green; Active, not recruiting → amber; Completed → neutral;
* Terminated/Suspended/Withdrawn → red; Unknown/Not yet recruiting → muted

**MeSH chips:**

* Render top **≤5** MeSH terms
* Click toggles selection; selection filters the table; “Clear” resets
* Chips are `<button>`s with visible focus; a11y labels present

**Acceptance:**

* Card shows citation, trial snippet, correct status icon + `aria-label`
* Chip selection filters table; export unaffected by UI filters

**CSS (append safely; no layout changes):**

```css
.card { border:2px solid var(--border); border-radius:.5rem; padding:.75rem; margin:.5rem 0; background:var(--bg); }
.card .row { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }
.status-dot { inline-size:.75rem; block-size:.75rem; border-radius:999px; background:var(--muted); }
[data-status="Recruiting"] .status-dot { background: var(--ok); }
[data-status="Active, not recruiting"] .status-dot { background: var(--warn); }
[data-status="Completed"] .status-dot { background: var(--muted); }
[data-status="Terminated"] .status-dot,
[data-status="Suspended"] .status-dot,
[data-status="Withdrawn"] .status-dot { background: var(--err); }
.mesh-chips { display:flex; gap:.4rem; flex-wrap:wrap; }
.mesh-chip { background:var(--chip); border:2px solid var(--chip-border); padding:.15rem .5rem; border-radius:999px; cursor:pointer; }
.mesh-chip[aria-pressed="true"] { border-color: var(--accent); }
.mesh-chip:focus { outline:3px solid var(--focus); outline-offset:2px; }
```

**JS (non-destructive glue):**

```js
function nlm(r){
  const a=(r.authors||'').trim(), t=r.title||'', j=r.journal||'', y=r.year||'';
  const v=r.volume?`${r.volume}`:'', i=r.issue?`(${r.issue})`:'', p=r.pages?`:${r.pages}`:'';
  const d=r.identifiers?.doi?` doi: ${r.identifiers.doi}`:'';
  return `${a}. ${t}. ${j}. ${y};${v}${i}${p}.${d}`.replace(/\s+/g,' ').trim();
}
function trialSnippet(ct){ const raw=ct?.briefSummary||ct?.description||''; return raw.length>800?raw.slice(0,800)+'…':raw; }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

function renderMeshChips(container, meshList){
  container.innerHTML='';
  (meshList||[]).slice(0,5).forEach(term=>{
    const b=document.createElement('button');
    b.className='mesh-chip'; b.type='button'; b.textContent=term; b.setAttribute('aria-pressed','false');
    b.addEventListener('click', ()=>{
      const on=b.getAttribute('aria-pressed')!=='true';
      b.setAttribute('aria-pressed', String(on));
      if(!window.meshFilter) window.meshFilter=new Set();
      if(on) window.meshFilter.add(term); else window.meshFilter.delete(term);
      renderTable(); // table renderer should honor window.meshFilter if present
    });
    container.appendChild(b);
  });
}

function rowDetailsCell(r){
  const status=r.sources?.clinicaltrials?.trialStatus || 'Unknown';
  const ct=r.sources?.clinicaltrials || {};
  return `
    <details>
      <summary>Details</summary>
      <div class="card" data-status="${escapeHtml(status)}" aria-label="Request details">
        <div class="row">
          <span class="status-dot" aria-label="${escapeHtml(status)}"></span>
          <span class="citation">${escapeHtml(r.citation || nlm(r))}</span>
        </div>
        ${ct.briefSummary?`<div class="trial-abs">${escapeHtml(trialSnippet(ct))}</div>`:''}
        <div class="mesh-chips" id="mesh-${r.id}"></div>
      </div>
    </details>`;
}
// After adding the row, call: renderMeshChips(document.getElementById(`mesh-${r.id}`), r.mesh);
```

---

## 7) Tests (must pass)

* Boot, Lookup (PMID/DOI/NCT), Bulk, Enrichment/Merge, Search, Export, Offline, A11Y
* **Screenshots:** Dashboard, Add New Request, All Requests, Import/Export, Settings (attach to `RELEASE_NOTES.md`)

---

## 8) Documentation & Code Quality (must-do each run)

Update:

* `documentation/QuickStart.md`
* `documentation/TechMaintenance.md`
* `documentation/DevelopersGuide.md`

Rules:

* Append dated **“What changed in this build”** to each
* Update `RELEASE_NOTES.md` and `CHANGELOG.md`
* JSDoc for all exported/public functions
* Rationale comments for non-obvious logic

**Fail the run** if docs are missing/outdated or exported functions lack JSDoc.

---

## 9) Agent Start Prompt (copy into Agent Mode)

> You are the lead developer for SilentStacks v2.0.
> Follow `documentation/Agent_Package/PLAYBOOK_v2.0_MASTER.md` **exactly**.
> Treat this playbook as **living**; update it when rules/features change.
> Preserve the v1.2 UI (no DOM/CSS changes).
> Build a single-file `dist/SilentStacks_v2_monolith.html` (no CDNs).
> Implement all v2.0 features, run tests, generate screenshots/docs, and package `SilentStacks_Release.zip`.
> **Pause for approval** before any DOM/CSS edits; provide diffs + screenshots.


## Quick self-check for your permalinked agent file

While I’m waiting on the link or file contents, you can sanity check it yourself in 30 seconds:

* ✅ Does it say **LIVING DOCUMENT** and require updates each run?
* ✅ Does it output **`dist/SilentStacks_v2_monolith.html`** (all inline, no CDNs)?
* ✅ Does it lock the table headings/order exactly as:
  `Urgency | Docline Number | PMID | Citation | Patron Name | Status`
* ✅ Are **PMID-only bulk paste/upload** rules there (enrich PubMed + CT.gov, ignore blanks)?
* ✅ Does it include **Record Cards & MeSH chips** requirements?
* ✅ Does it **fail the run** on DOM/CSS drift or missing docs/JSDoc?
* ✅ Does it demand **screenshots** and a **GAP\_REPORT.md** each run?

If any of those are missing, paste your permalink here and I’ll patch it to match this master.

Want me to also generate a **RELEASE\_NOTES.md** template with screenshot slots so the agent can’t skip them?
