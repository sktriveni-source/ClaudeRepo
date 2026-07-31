# AI-Enterprise Platform

A unified enterprise platform covering three business domains, each with AI-assisted
workflows: **Product Lifecycle Management (PLM)**, **Master Data Management (MDM)**,
and a **Sales CRM & Customer Intelligence Platform**.

## Architecture

```
server/   Express REST API, in-memory data store, AI helper layer
client/   React + TypeScript SPA (Vite), calls the API via /api/* (proxied in dev)
```

### Backend (`server/`)

- `src/data` — seed data for all three domains (products, documents, change
  requests; data sources, master records, validation rules; accounts, contacts,
  leads, opportunities, activities).
- `src/store/collection.js` — a tiny in-memory CRUD collection with automatic
  audit-log entries on create/update/delete (the `AuditHistory` entity from the
  spec), shared by every module.
- `src/ai/aiClient.js` — wraps the Anthropic SDK. When `ANTHROPIC_API_KEY` is
  set, AI-generated content (document summaries, natural-language answers,
  customer insights, cleansing suggestions) is produced by **Claude Opus 5**.
  Without a key, every AI feature falls back to a deterministic, rule-based
  implementation so the platform is fully functional out of the box. Numeric
  scores that the spec defines as formulas (lead score, weighted pipeline,
  data-quality score, opportunity risk) are always computed deterministically
  in code — AI is used for the generative/narrative parts, never to replace a
  defined formula.
- `src/ai/{plm,mdm,crm}Ai.js` — the domain-specific AI features:
  - **PLM**: keyword search over products/documents (retrieval), natural-language
    Q&A grounded in that retrieval (RAG-style), document summarization,
    duplicate-product detection, data-quality recommendations.
  - **MDM**: duplicate detection across customer/supplier/product records,
    natural-language-to-filter query translation, cleansing suggestions.
  - **CRM**: lead scoring, opportunity risk detection, Customer 360 AI
    insights, next-best-action recommendations, the AI Sales Assistant.
- `src/routes/{plm,mdm,crm}.js` — REST endpoints per module (see below).

### Frontend (`client/`)

A single React app with a shared sidebar/top-bar shell (`components/`) and one
route tree per module (`modules/plm`, `modules/mdm`, `modules/crm`), plus a
platform-wide `HomePage`. Highlights:

- **PLM** — Dashboard, Products, Product Detail (documents with AI summarize,
  change requests, AI data-quality recommendations, audit history), Change
  Requests, AI Assistant (natural-language search + duplicate detection).
- **MDM** — Dashboard, Data Sources, Records (expandable rows with AI
  cleansing suggestions), Issue management workflow, AI Assistant
  (natural-language query + duplicate detection).
- **CRM** — Dashboard, Accounts, **Customer 360**, Leads (AI scoring, qualify/
  convert), Opportunities, **Opportunity detail** (AI risk + next-best-action),
  Pipeline visualization, Forecast, **AI Sales Assistant**.

The top bar shows whether AI responses are currently coming from Claude Opus 5
or the heuristic fallback.

## Running locally

```bash
# Terminal 1 — API server (http://localhost:4100)
cd server
npm install
npm run dev

# Terminal 2 — web app (http://localhost:5174)
cd client
npm install
npm run dev
```

Open `http://localhost:5174`. The Vite dev server proxies `/api/*` to
`http://localhost:4100`.

### Enabling Claude Opus 5

By default the platform runs entirely on rule-based heuristics — no API key
required. To enable real AI-generated summaries, insights, and answers, set an
Anthropic API key before starting the server:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

## Core REST APIs

```
GET  /api/health

GET  /api/plm/dashboard
GET  /api/plm/products                GET /api/plm/products/:id
POST /api/plm/products                PUT /api/plm/products/:id
GET  /api/plm/products/:id/documents  POST /api/plm/products/:id/documents
GET  /api/plm/change-requests         POST/PUT /api/plm/change-requests(/:id)
GET  /api/plm/audit
POST /api/plm/ai/search               POST /api/plm/ai/query
POST /api/plm/ai/summarize-document   GET  /api/plm/ai/duplicates

GET  /api/mdm/dashboard
GET  /api/mdm/sources                 GET /api/mdm/records
GET  /api/mdm/rules                   GET/PUT /api/mdm/issues(/:id)
GET  /api/mdm/ai/duplicates           POST /api/mdm/ai/cleansing-suggestions
POST /api/mdm/ai/query

GET  /api/crm/dashboard               GET /api/crm/opportunities/pipeline
GET  /api/crm/opportunities/forecast
GET  /api/crm/accounts(/:id)          GET /api/crm/accounts/:id/customer360
GET  /api/crm/leads                   POST /api/crm/leads/:id/qualify
POST /api/crm/leads/:id/convert
GET  /api/crm/opportunities(/:id)     POST /api/crm/activities
POST /api/crm/ai/lead-score           POST /api/crm/ai/opportunity-risk
POST /api/crm/ai/customer-summary     POST /api/crm/ai/next-best-action
POST /api/crm/ai/query
```

## Notes

- Data is in-memory and resets whenever the server restarts — no database
  dependency, so the app runs anywhere Node.js is available.
- This app lives alongside the unrelated `client/`/`server/` train-schedule
  demo at the repo root; it is fully self-contained under
  `ai-enterprise-platform/` with its own ports (API `4100`, web app `5174`).
- The recommended production stack from the original brief (ASP.NET Core,
  SQL Server, Azure AI Search, Microsoft Entra ID, etc.) is a reasonable
  target for a real deployment; this build uses a Node/Express + React stack
  to stay consistent with the rest of this repository and to run without any
  external infrastructure.
