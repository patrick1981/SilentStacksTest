# Module Contracts (v2.1)

## RequestCapture
- In: {pmid|doi|nct|title, requestorEmail, notes?}
- Out: Normalized identifier payload
- Guarantees: email regex, ID regex, AAA form errors

## HeaderMapper
- In: CSV headers[]
- Out: Canonical map to {PMID, DOI, NCT, Title, Authors, Journal, Year}
- Guarantees: auto-dict mapping; unmapped → fatal

## BulkEngine
- In: rows[], limit=50_000
- Out: processed batches, checkpoint state
- Guarantees: chunking (e.g., 250/shot), progress events (ARIA live), cutoff enforcement

## RateLimiter
- In: fn(request), rate=2/sec (PubMed)
- Out: scheduled executions
- Guarantees: steady rate, burst absorb, cancel on teardown

## RetryQueue
- In: failed jobs {req, cause}
- Out: replays with backoff (5s,10s,20s,40s,80s)
- Guarantees: max 5 tries, persisted in IDB, resume on reconnect

## Enrichment
- In: identifier payload
- Out: metadata {title, authors, journal, year, doi, pmid, nct}
- Guarantees: PubMed primary; CrossRef fallback; mismatch flags

## Reconciler
- In: multiple metadata sources
- Out: final record + conflicts[]
- Guarantees: deterministic precedence; conflict badge

## Storage (IDB)
- In: record[]
- Out: idbKey
- Guarantees: versioned schema, quota check, atomic batch

## UIController
- In: events (progress, error, conflict)
- Out: table/card updates + announcements
- Guarantees: AAA (roles, labels, focus), linkout parity (card & table)

## Exporter
- In: filter (all|clean|dirty)
- Out: CSV/JSON blob
- Guarantees: canonical headers; newline/encoding safe

## SW (Service Worker)
- In: fetch events
- Out: cache-first; bg sync
- Guarantees: scope HTTPS; offline banner; only idempotent replays
