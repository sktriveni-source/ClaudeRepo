# AI-PLM — AI-Powered Product Lifecycle Management Platform

An enterprise PLM demo application: a central product and document repository
with lifecycle workflows, role-based access, change requests, audit history,
and an AI assistant for natural-language product information retrieval.

## Business problem

Product information, technical documents, lifecycle status, and compliance
data are usually scattered across many systems. Product teams lose time
searching for information and checking data quality. This app centralizes
that data and adds AI capabilities on top of it.

## Key features

- **Product & document management** — a searchable product catalog with
  categories, attributes, revisions, and attached technical documents
  (specifications, drawings, compliance certificates, manuals, test reports).
- **Lifecycle workflows** — products move through Concept → Design → Active →
  Phase-Out → End-of-Life → Obsolete.
- **Role-based access** — five roles (Administrator, Product Manager,
  Engineer, Compliance Officer, Viewer) with a server-enforced permission
  matrix covering products, documents, change requests, audit access, and AI
  insight tooling.
- **Product search** — filter by keyword, category, lifecycle stage, and
  compliance status.
- **Dashboards** — catalog-wide stats, an end-of-life watchlist, change
  request status breakdown, and lifecycle-stage distribution.
- **Change requests (ECRs)** — filed against a product, tracked through
  Draft → Submitted → In Review → Approved/Rejected → Implemented, with a
  kanban board across the whole catalog.
- **Audit history** — every product, document, and change-request mutation is
  recorded with actor, timestamp, and details; viewable per-product or
  catalog-wide.
- **AI assistant** — ask natural-language questions like *"Show products
  approaching end-of-life with unresolved change requests"* and get back a
  synthesized answer plus the matching product/document/change-request cards.

## AI capabilities

This is a self-contained demo with no external LLM dependency — the "AI"
layer (`server/src/services/aiService.js`) is a set of deterministic,
explainable heuristics that stand in for the RAG/LLM pipeline a production
system would use:

- **RAG-style natural language query answering** — intent detection (EOL,
  unresolved change requests, non-compliance, category, duplicates, data
  quality) composed into structured filters, with a keyword-overlap
  retrieval fallback across products and documents when no intent matches.
- **Document summarization** — extractive summarization that scores
  sentences by term frequency and picks the top three.
- **Duplicate product detection** — Jaccard similarity over product names,
  descriptions, and tags within the same category, surfaced as ranked pairs
  with a similarity score and reason.
- **Automated metadata extraction** — regex-based extraction of structured
  fields (Material, Weight, Revision, Compliance Standard, VOC Content, etc.)
  from free-text document content.
- **Product data quality recommendations** — rule-based checks for missing
  owners/descriptions, products with no attached documents, lifecycle/EOL
  date mismatches, stale (unreviewed) active products, and non-compliant
  products with no open remediation change request.

Swapping this service for a real embeddings index + LLM call is a drop-in
replacement — the routes and UI only depend on the shapes returned by
`aiService.js`.

## Architecture

```
server/   Express REST API, in-memory data store (no external DB required)
client/   React + TypeScript SPA (Vite), calls the API via /api/* (proxied in dev)
```

### Backend (`server/`)

- `src/data` — seed data: users, products, documents, change requests, and
  audit log, plus the shared constants (roles, lifecycle stages, compliance
  statuses, permission matrix).
- `src/store/db.js` — in-memory CRUD store. Every mutation appends an audit
  log entry automatically.
- `src/middleware/auth.js` — demo-grade bearer-token auth (the token is the
  user id, issued by `/api/auth/login`) plus `requirePermission(action)`,
  which checks the role against `PERMISSIONS` in `data/constants.js`.
- `src/services/aiService.js` — the AI feature set described above.
- `src/routes` — `auth`, `products` (incl. nested documents/change-requests/
  audit), `documents`, `change-requests`, `audit`, `dashboard`, `ai`.

### Frontend (`client/`)

React Router pages: Login (role picker) → Dashboard → Products (search/
filter) → Product Detail (Overview / Documents / Change Requests / Audit
History tabs) → Change Requests (kanban) → AI Assistant (chat) → Data
Quality → Duplicate Detection → Audit Log. UI affordances (edit fields,
upload documents, approve change requests, view audit) are shown or hidden
based on the signed-in user's role; the server enforces the same rules
independently.

## Demo users

Login is a role picker backed by seed users — no password:

| Name | Email | Role |
| --- | --- | --- |
| Ava Administrator | admin@aiplm.com | Administrator |
| Priya Menon | pm@aiplm.com | Product Manager |
| Ethan Wright | engineer@aiplm.com | Engineer |
| Carla Nunez | compliance@aiplm.com | Compliance Officer |
| Victor Lee | viewer@aiplm.com | Viewer |

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
- Auth is intentionally a demo mock (pick-a-user login, token = user id) to
  make role-based access easy to explore; it is not a real credential check.
