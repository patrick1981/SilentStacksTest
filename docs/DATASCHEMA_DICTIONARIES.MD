# Data Schema (v2.1)

## Request (IDB)
- id: string (uuid)
- pmid?: string
- doi?: string
- nct?: string
- title: string
- authors?: string
- journal?: string
- year?: string
- status: enum("clean","dirty","error","queued")
- conflicts?: string[] // human-readable fields w/ disagreement
- createdAt: iso8601
- updatedAt: iso8601

## Preferences (localStorage)
- theme: "light"|"dark"|"high-contrast"
- tableView: "compact"|"comfortable"

## Header Dictionary (partial)
{
  "pmid": "PMID",
  "pubmed id": "PMID",
  "doi": "DOI",
  "digital object identifier": "DOI",
  "nct": "NCT",
  "clinical trial id": "NCT",
  "title": "Title",
  "article title": "Title",
  "authors": "Authors",
  "journal": "Journal",
  "year": "Year"
}

