# ClinicalTrials.gov API v2 Integration Plan for SilentStacks

## Actual API Structure (Based on Research)

### Base URL and Current Status
- **API v2 URL**: `https://clinicaltrials.gov/api/v2/studies`
- **Status**: Active (v1 retired June 2024)
- **Authentication**: None required
- **Rate Limits**: ~50 requests/minute per IP
- **Format**: JSON (default) or CSV

### Key Search Parameters

```javascript
// Main search endpoint structure
GET https://clinicaltrials.gov/api/v2/studies?{parameters}

// Available query parameters:
{
  "query.cond": "condition name",           // Disease/condition
  "query.intr": "intervention name",        // Drug/treatment
  "query.term": "general search terms",    // Free text search
  "query.titles": "title search",          // Search in study titles
  "pageSize": 100,                         // Results per page (max 1000)
  "pageToken": "nextPageToken",            // For pagination
  "countTotal": true,                      // Include total count
  "format": "json"                         // json or csv
}
```

### Actual Data Structure Available

Based on API v2 response analysis, each study contains:

```javascript
{
  "studies": [
    {
      "protocolSection": {
        "identificationModule": {
          "nctId": "NCT12345678",                    // The NCT number
          "briefTitle": "Short public title",       // User-friendly title
          "officialTitle": "Full scientific title", // Complete formal title
          "acronym": "STUDY-NAME",                   // Study acronym (if any)
          "orgStudyIdInfo": {
            "id": "SPONSOR-123"                      // Sponsor's internal ID
          },
          "organization": {
            "fullName": "University of...",          // Lead organization
            "class": "OTHER"                         // Org type
          }
        },
        "statusModule": {
          "statusVerifiedDate": "2023-01",          // Last verified
          "overallStatus": "RECRUITING",            // Current status
          "startDateStruct": {
            "date": "2023-01-15",                   // Start date
            "type": "ACTUAL"
          },
          "primaryCompletionDateStruct": {
            "date": "2024-12-31",                   // Expected completion
            "type": "ESTIMATED"
          }
        },
        "designModule": {
          "studyType": "INTERVENTIONAL",            // Study type
          "phases": ["PHASE3"],                     // Study phase(s)
          "designInfo": {
            "allocation": "RANDOMIZED",
            "interventionModel": "PARALLEL",
            "masking": "DOUBLE"
          }
        },
        "conditionsModule": {
          "conditions": ["Diabetes", "Type 2"]      // Medical conditions
        },
        "interventionsModule": {
          "interventions": [
            {
              "type": "DRUG",
              "name": "Metformin",
              "description": "500mg daily"
            }
          ]
        }
      }
    }
  ],
  "totalCount": 1234,                               // Total matching studies
  "nextPageToken": "token123"                       // For next page
}
```

## What Users Actually Need to Know

### Study Identification
- **NCT Number**: `NCT12345678` - The unique identifier everyone uses
- **Brief Title**: User-friendly name like "Weight Loss Study for People With Type 2 Diabetes"
- **Official Title**: Full scientific title (often very long)
- **Acronym**: Short name like "DIABETES-CARE" (if available)

### Study Status Information
- **Overall Status**: 
  - `NOT_YET_RECRUITING` - Planning phase
  - `RECRUITING` - Actively enrolling participants
  - `ACTIVE_NOT_RECRUITING` - Running but not enrolling
  - `COMPLETED` - Finished
  - `TERMINATED` - Stopped early
  - `SUSPENDED` - Temporarily paused
  - `WITHDRAWN` - Cancelled before starting

### Study Details
- **Study Type**: `INTERVENTIONAL` (clinical trial) vs `OBSERVATIONAL` (research study)
- **Phase**: `PHASE1`, `PHASE2`, `PHASE3`, `PHASE4`, `NOT_APPLICABLE`
- **Conditions**: Medical conditions being studied
- **Interventions**: Treatments being tested
- **Start/Completion Dates**: Timeline information

## Integration Value for Systematic Reviews

### 1. Publication Bias Detection
```javascript
// Find completed but potentially unpublished studies
const completedStudies = await searchClinicalTrials({
  "query.cond": "diabetes",
  "query.intr": "metformin", 
  // Filter for completed studies that might not be published
});
```

### 2. Protocol Information Access
- Original study designs before publication
- Primary vs secondary outcome measures
- Sample size calculations
- Inclusion/exclusion criteria

### 3. Comprehensive Study Identification
- Industry-sponsored trials (often not in academic databases initially)
- International studies with English registry entries
- Early-phase studies that might not get published

## Practical Implementation for SilentStacks

### Phase 1: Basic NCT Lookup
Add to existing lookup functionality:

```javascript
class ClinicalTrialsLookup {
  static async lookupByNCT(nctId) {
    try {
      const response = await fetch(
        `https://clinicaltrials.gov/api/v2/studies/${nctId}?format=json`
      );
      
      if (!response.ok) throw new Error('Study not found');
      
      const data = await response.json();
      const study = data.studies[0];
      
      return this.formatForSilentStacks(study);
    } catch (error) {
      throw new Error(`Failed to lookup NCT${nctId}: ${error.message}`);
    }
  }

  static formatForSilentStacks(study) {
    const identification = study.protocolSection.identificationModule;
    const status = study.protocolSection.statusModule;
    const design = study.protocolSection.designModule || {};
    const conditions = study.protocolSection.conditionsModule || {};
    const interventions = study.protocolSection.interventionsModule || {};

    return {
      // Standard SilentStacks fields
      id: identification.nctId,
      title: identification.briefTitle,
      authors: identification.organization?.fullName || 'Unknown',
      journal: 'ClinicalTrials.gov',
      year: status.startDateStruct?.date?.split('-')[0] || '',
      doi: '',
      pmid: '',
      
      // Clinical trial specific fields
      nctId: identification.nctId,
      officialTitle: identification.officialTitle,
      acronym: identification.acronym || '',
      studyType: design.studyType || '',
      phases: design.phases || [],
      overallStatus: status.overallStatus || '',
      conditions: conditions.conditions || [],
      interventions: interventions.interventions?.map(i => i.name) || [],
      startDate: status.startDateStruct?.date || '',
      completionDate: status.primaryCompletionDateStruct?.date || '',
      
      // Source tracking
      source: 'clinicaltrials.gov',
      sourceUrl: `https://clinicaltrials.gov/study/${identification.nctId}`
    };
  }
}
```

### Phase 2: Enhanced Search
Add search capability to the existing request form:

```html
<!-- Add to lookup section -->
<div class="clinical-trials-lookup">
  <h4>🧪 Clinical Trials Lookup</h4>
  
  <div class="lookup-options">
    <!-- NCT Direct Lookup -->
    <div class="form-group">
      <label>NCT Number</label>
      <div class="input-with-button enhanced">
        <input type="text" 
               id="nct-lookup" 
               placeholder="NCT12345678"
               pattern="NCT[0-9]{8}">
        <button type="button" onclick="lookupNCT()" class="lookup-btn">
          <span>🔍</span> Lookup NCT
        </button>
      </div>
    </div>
    
    <!-- Condition/Intervention Search -->
    <div class="form-group">
      <label>Search Clinical Trials</label>
      <div class="search-filters">
        <input type="text" id="ct-condition" placeholder="Condition (e.g., diabetes)">
        <input type="text" id="ct-intervention" placeholder="Intervention (e.g., metformin)">
        <select id="ct-status">
          <option value="">Any Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="RECRUITING">Recruiting</option>
          <option value="ACTIVE_NOT_RECRUITING">Active, not recruiting</option>
        </select>
        <button type="button" onclick="searchClinicalTrials()">Search Trials</button>
      </div>
    </div>
  </div>
  
  <div id="ct-results" class="lookup-results"></div>
</div>
```

### Phase 3: Form Integration
Add clinical trial fields to the request form:

```html
<!-- Add new fieldset to request form -->
<fieldset class="fieldset-enhanced">
  <legend>📋 Clinical Trial Information <span class="field-priority optional">Optional</span></legend>
  
  <div class="form-grid form-grid-2">
    <div class="form-group">
      <label class="form-label">NCT Number</label>
      <input type="text" 
             id="nctId" 
             pattern="NCT[0-9]{8}" 
             placeholder="NCT12345678"
             class="form-control">
      <small class="form-help">Official ClinicalTrials.gov identifier</small>
    </div>
    
    <div class="form-group">
      <label class="form-label">Study Phase</label>
      <select id="studyPhase" class="form-control">
        <option value="">Not applicable/Unknown</option>
        <option value="PHASE1">Phase I</option>
        <option value="PHASE2">Phase II</option>
        <option value="PHASE3">Phase III</option>
        <option value="PHASE4">Phase IV</option>
        <option value="NOT_APPLICABLE">Not Applicable</option>
      </select>
    </div>
  </div>
  
  <div class="form-grid form-grid-2">
    <div class="form-group">
      <label class="form-label">Study Status</label>
      <select id="studyStatus" class="form-control">
        <option value="">Unknown</option>
        <option value="NOT_YET_RECRUITING">Not yet recruiting</option>
        <option value="RECRUITING">Recruiting</option>
        <option value="ACTIVE_NOT_RECRUITING">Active, not recruiting</option>
        <option value="COMPLETED">Completed</option>
        <option value="TERMINATED">Terminated</option>
        <option value="SUSPENDED">Suspended</option>
        <option value="WITHDRAWN">Withdrawn</option>
      </select>
    </div>
    
    <div class="form-group">
      <label class="form-label">Study Type</label>
      <select id="studyType" class="form-control">
        <option value="">Unknown</option>
        <option value="INTERVENTIONAL">Interventional</option>
        <option value="OBSERVATIONAL">Observational</option>
      </select>
    </div>
  </div>
</fieldset>
```

## User Workflow Examples

### Systematic Review Scenario 1: Finding Unpublished Studies
1. **Search by condition**: "Type 2 Diabetes" 
2. **Filter by status**: "Completed" 
3. **Cross-reference**: Check if NCT numbers appear in published literature
4. **Flag for follow-up**: Studies completed >2 years ago with no publications

### Systematic Review Scenario 2: Protocol Verification
1. **Enter known NCT number** from published paper
2. **Compare outcomes**: Published primary endpoint vs registered primary endpoint
3. **Check dates**: Registration date vs study start vs publication date
4. **Flag discrepancies**: Potential selective reporting issues

### Systematic Review Scenario 3: Comprehensive Search
1. **Search multiple terms**: Condition + various intervention names
2. **Export results**: Add relevant trials to SilentStacks requests
3. **Track status**: Monitor ongoing studies that might complete during review
4. **Plan updates**: Note when follow-up searches should be conducted

## Dashboard Integration

### New Statistics
- Number of clinical trials tracked
- Status distribution (recruiting, completed, etc.)
- Phase distribution 
- Average time from completion to publication (for matched studies)

### Enhanced Filtering
- Filter by NCT number presence
- Filter by study status
- Filter by study phase
- Filter by study type

## Offline Considerations

Since SilentStacks needs to work on a thumb drive:
1. **Cache recent lookups** for offline access
2. **Queue failed lookups** for when connectivity returns
3. **Graceful degradation** when API unavailable
4. **Show connectivity status** for clinical trials API specifically

## Implementation Priority

**Phase 1** (Most valuable for systematic reviews):
- Basic NCT number lookup and auto-fill
- Add NCT field to request form
- Simple search by condition/intervention

**Phase 2** (Enhanced functionality):
- Advanced filtering by status/phase
- Bulk NCT lookup for multiple studies
- Export enhancement with clinical trial data

**Phase 3** (Advanced features):
- Publication bias detection tools
- Protocol comparison capabilities
- Automated cross-referencing with PubMed

## Real-World Value

For an 80-year-old or 8-year-old user, the interface should be simple:
1. **"Enter NCT number"** - one field, one button
2. **Auto-fill form** - let the system populate what it can
3. **Clear status indicators** - "This study is complete but no publication found"
4. **Simple search** - "Find diabetes studies" rather than complex filters

This makes clinical trial integration truly valuable for systematic reviews while maintaining the app's user-friendly approach.