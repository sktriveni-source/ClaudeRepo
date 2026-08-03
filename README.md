# ProductPulse — Product Lifecycle Management App

A full-stack app for managing products through their lifecycle — from
**Develop → Launch/Introduction → Growth → Maturity → Decline** — with a
built-in approval workflow for stage changes, and centrally managed customer
and supplier data for every product.

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
- **Customers & suppliers** — each product tracks the customers who buy it
  and the suppliers who provide its components/materials, with full
  add/edit/remove support, shown in dedicated tabs on the product page.
- **Audit trail** — every create, edit, delete, customer/supplier change, and
  stage-change decision is logged per product and viewable in a "Workflow &
  audit" tab.
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
- `src/store/db.js` — centralized in-memory store: products (with nested
  customers/suppliers), stage-change requests, and the audit log. All
  mutations go through this module and are recorded to the audit log.
- `src/routes/products.js` — `GET/POST /api/products`,
  `GET/PUT/DELETE /api/products/:id`, plus nested
  `/api/products/:id/customers[/:customerId]` and
  `/api/products/:id/suppliers[/:supplierId]`, and
  `GET /api/products/:id/requests` / `/audit`.
- `src/routes/approvals.js` — `GET/POST /api/stage-requests`,
  `POST /api/stage-requests/:id/approve`, `POST /api/stage-requests/:id/reject`.
- `src/routes/stages.js` — `GET /api/stages` (pipeline metadata).

### Frontend (`client/`)

- **Products page** — searchable/filterable catalog with stage counts,
  create/delete actions.
- **Product detail page** — lifecycle tracker, edit/delete, "Request stage
  change" action, and tabs for Overview / Customers / Suppliers / Workflow &
  audit.
- **Approvals page** — pending stage-change requests across all products,
  with approve/reject actions and decision history.

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
