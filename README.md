# ProductPulse — Product Lifecycle Management App

A full-stack app for managing products through their lifecycle — from
**Develop → Launch/Introduction → Growth → Maturity → Decline** — with a
built-in approval workflow for stage changes, and centrally managed customer
and supplier data for every product. Several capabilities are modeled on
Dassault Systèmes' 3DEXPERIENCE/ENOVIA PLM suite (change management, BOM
management, revision control, collaboration, reporting), scaled down to fit
a lightweight business-lifecycle app rather than an engineering/CAD one.

## Features

- **Product CRUD** — create, edit, and delete products (name, SKU, category,
  description, price, cost, owner).
- **Lifecycle pipeline** — every new product starts in **Develop**. A visual
  tracker on the product page shows progress through Develop → Launch/
  Introduction → Growth → Maturity → Decline.
- **Workflow & approvals** — moving a product to a new stage doesn't happen
  instantly. A user submits a stage-change request with a justification; it
  lands in a shared **Approvals inbox** where an approver signs off
  (approve/reject with a comment) before the product's stage actually
  changes. Only one stage-change request can be pending per product at a
  time.
- **Role-gated change management** (ENOVIA-style) — only a user acting under
  the **Approver** persona can approve or reject a stage-change request; the
  server enforces this (403 otherwise), and the UI disables the buttons and
  explains why for anyone else.
- **Revision control** (ENOVIA-style maturity states) — every product carries
  a revision letter (A, B, C…) that bumps automatically whenever a
  stage-change request is approved, with a full revision history (who
  released it, to which stage, when, with what comment).
- **Bill of Materials** (ENOVIA BOM Management) — each product has a
  components list (part number, name, quantity, unit cost) with an automatic
  cost rollup, shown per-product and aggregated on the dashboard.
- **Collaboration thread** (ENOVIA collaborative spaces) — a per-product
  discussion tab for posting and removing comments as the current persona.
- **Reporting dashboard** (ENOVIA reporting/analytics) — portfolio-wide KPIs:
  products per stage with average cycle time in each stage, approved vs.
  rejected decisions, category breakdown, and total BOM cost across the
  catalog.
- **Customers & suppliers** — each product tracks the customers who buy it
  and the suppliers who provide its components/materials, with full
  add/edit/remove support, shown in dedicated tabs on the product page.
- **Audit trail** — every create, edit, delete, customer/supplier/component/
  comment change, and stage-change decision is logged per product and
  viewable in a "Workflow & audit" tab.
- **Persona switcher** — a lightweight header control to act as different
  Product Managers / Approvers (no real auth — this is a demo of the
  workflow, not a security boundary).
- **Centralized data** — a single Express REST API is the one source of
  truth for every client; there's no per-client or per-page local state that
  can drift from the server.

## Architecture

```
server/   Express REST API, in-memory data store (no external DB required)
client/   React + TypeScript SPA (Vite), calls the API via /api/* (proxied in dev)
```

### Backend (`server/`)

- `src/data/stages.js` — the five lifecycle stages, in order; the single
  source of truth for stage sequencing.
- `src/data/seed.js` — demo products, customers, and suppliers loaded on
  startup.
- `src/utils/revision.js` — spreadsheet-column-style revision letter
  increment (A → B → ... → Z → AA).
- `src/store/db.js` — centralized in-memory store: products (with nested
  customers/suppliers/components/comments/revision history), stage-change
  requests, and the audit log. All mutations go through this module and are
  recorded to the audit log. `getDashboardStats()` derives portfolio KPIs
  and per-stage cycle time from the approved-request timeline.
- `src/routes/products.js` — `GET/POST /api/products`,
  `GET/PUT/DELETE /api/products/:id`, plus nested
  `/api/products/:id/customers[/:customerId]`,
  `/api/products/:id/suppliers[/:supplierId]`,
  `/api/products/:id/components[/:componentId]` (BOM),
  `/api/products/:id/comments[/:commentId]`, and
  `GET /api/products/:id/requests` / `/audit`.
- `src/routes/approvals.js` — `GET/POST /api/stage-requests`,
  `POST /api/stage-requests/:id/approve`, `POST /api/stage-requests/:id/reject`
  (both require `role: "Approver"` in the body, else `403`).
- `src/routes/stages.js` — `GET /api/stages` (pipeline metadata).
- `src/routes/dashboard.js` — `GET /api/dashboard` (portfolio KPIs).

### Frontend (`client/`)

- **Dashboard page** (`/`) — KPI tiles (products, pending/approved/rejected
  requests, total BOM cost), a stage funnel with average days-in-stage, an
  approved-vs-rejected bar, and a category breakdown.
- **Products page** (`/products`) — searchable/filterable catalog with stage
  counts, revision, create/delete actions.
- **Product detail page** — lifecycle tracker, revision badge, edit/delete,
  "Request stage change" action, and tabs for Overview / Components (BOM) /
  Customers / Suppliers / Discussion / Workflow & audit (which includes both
  the stage-request history and the revision history).
- **Approvals page** — pending stage-change requests across all products,
  with approve/reject actions gated to the Approver persona, and decision
  history.

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
  database dependency, so the app runs anywhere Node.js is available. The
  in-memory store is still the single centralized source of truth while the
  server is running: every client reads/writes through the same API.
- The persona switcher in the header is for demonstrating the
  requester/approver workflow only — it is not authentication.
