# DataTrust MDM — AI-Enterprise Master Data Management Platform

A full-stack demo of a centralized data-quality / MDM platform: it connects
to (mock) enterprise databases and APIs, profiles the data they hold,
detects duplicates and validation issues, scores data quality, and routes
every fix through a human-in-the-loop approval workflow. Several features
are framed as "AI opportunities" from the original brief — implemented as
transparent, explainable rule/heuristic engines rather than opaque model
calls, so every suggestion can be inspected and audited.

## Business problem it addresses

Customer, supplier, and product data pulled from SAP, Oracle, Salesforce,
NetSuite, Shopify, and vendor APIs is riddled with duplicates, missing
fields, inconsistent formats (phone numbers, tax IDs, category casing) and
outright conflicting values across systems. This app is the "single pane of
glass" that surfaces and helps resolve that mess before it corrupts
downstream reporting, procurement, and CRM workflows.

## Key features

- **Data-source connections** — register and "sync" mock database/API
  connections per domain (suppliers, customers, products).
- **Profiling** — per-field completeness, uniqueness, distinct-value counts,
  and format-consistency analysis (e.g. "3 different phone formats
  detected").
- **Validation rules** — required/regex/range/enum rules per field, run on
  demand to generate issues.
- **Duplicate detection** — weighted, explainable similarity scoring (name,
  tax ID, address, email) with union-find clustering and a suggested golden
  record.
- **Data-quality scoring** — a 0–100 score per record/source/domain from
  four weighted dimensions: completeness, validity, uniqueness, consistency.
- **Issue management** — a single queue for every completeness, validity,
  and anomaly finding, with AI-suggested fixes.
- **Dashboards** — overall score, trend, issues by severity/category,
  duplicate cluster counts, pending approvals, source health.
- **Approval workflows** — duplicate merges and cleansing fixes are staged
  as approval requests; nothing touches golden data until a steward
  approves it.

## AI opportunities (implemented as explainable rule engines)

- **Intelligent duplicate detection** — see `services/duplicateDetection.js`.
- **Field mapping recommendations** — suggest how a new source's raw column
  names map onto the canonical schema (`services/fieldMapping.js`).
- **Anomaly detection** — z-score outliers within a cohort, e.g. a supplier's
  category peers (`services/anomalyDetection.js`).
- **Automatic data classification** — customer tiering, supplier
  criticality, product price tiers (`services/classification.js`).
- **Cleansing suggestions** — concrete, explainable fix proposals per issue
  (`services/cleansingSuggestions.js`).
- **Natural-language querying** — the "Ask the Data" page turns a prompt
  like *"Find suppliers with incomplete address information and duplicate
  tax IDs"* into a structured query and runs it (`services/nlQuery.js`).
- **Natural-language rule creation** — turn "Suppliers must have a valid tax
  ID" into a structured validation rule (`services/nlRuleBuilder.js`).

## Architecture

```
server/   Express REST API, in-memory data store (no external DB required)
client/   React + TypeScript SPA (Vite), calls the API via /api/* (proxied in dev)
```

### Backend (`server/`)

- `src/data` — seed data: 7 mock enterprise data sources and ~50 supplier /
  customer / product records with deliberately injected duplicates, missing
  fields, and format inconsistencies.
- `src/store/db.js` — in-memory store for sources, records, rules, issues,
  duplicate clusters, and approvals.
- `src/services` — profiling, validation, duplicate detection, quality
  scoring, classification, anomaly detection, cleansing suggestions, field
  mapping, and the two NL engines described above.
- `src/routes` — REST endpoints for all of the above under `/api/*`.

On boot the server runs an initial validation, duplicate-detection, and
anomaly pass so the dashboard is populated immediately.

### Frontend (`client/`)

React Router pages: Dashboard, Data Sources, Profiling, Validation Rules,
Duplicate Detection, Issue Management, Approvals, and **Ask the Data**
(natural-language query + field-mapping demo).

## Running locally

```bash
# Terminal 1 — API server (http://localhost:4000)
cd server
npm install
npm run dev

# Terminal 2 — web app (http://localhost:5173)
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so just open
`http://localhost:5173`.

## Notes

- Data is in-memory and resets whenever the server restarts — there's no
  database dependency, so the app runs anywhere Node.js is available.
- Every AI feature is a transparent, inspectable rule/heuristic engine
  (no external LLM calls), by design — each response explains exactly why
  it made a given suggestion.
