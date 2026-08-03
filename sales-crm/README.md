# Pipeline360 — Sales CRM

A full-stack sales lifecycle CRM modeled on the Salesforce Lead → Opportunity
flow: capture a lead, nurture it, convert it into an Account / Contact /
Opportunity, and drive the deal through to close.

## Sales lifecycle

```
Lead / Engagement → Nurture Lead → [convert] → Opportunity → Qualify →
Proposal → Negotiation → Contract → Execute → Closure (Won / Lost)
```

- **Leads** capture initial engagement (web, referral, trade show, etc.) and
  move through `New` → `Nurturing` before either being **converted** or
  **disqualified**.
- **Converting** a lead creates (or reuses) an **Account**, a **Contact**,
  and a new **Opportunity** at the `Opportunity` stage — mirroring
  Salesforce's lead conversion.
- **Opportunities** progress through `Opportunity → Qualify → Proposal →
  Negotiation → Contract → Execute → Closed Won/Lost`, each stage carrying a
  win probability used to compute weighted pipeline value.
- Every status/stage transition, and every call/email/meeting/note logged
  against a Lead, Account, Contact or Opportunity, is recorded as a
  timestamped **Activity** — a central sales transaction/audit log for the
  full lifecycle.

## Architecture

```
server/   Express REST API, in-memory data store (no external DB required)
client/   React + TypeScript SPA (Vite), calls the API via /api/* (proxied in dev)
```

### Backend (`server/`)

- `src/data/pipeline.js` — lifecycle stage definitions, lead sources,
  industries, owners.
- `src/data/seed.js` — seeds a realistic starting dataset (leads at various
  stages, converted accounts/contacts, opportunities across the pipeline).
- `src/store/db.js` — in-memory store for Leads, Accounts, Contacts,
  Opportunities and Activities, plus the lead-conversion and stage-transition
  state machines and the dashboard aggregation logic.
- `src/routes` — REST endpoints for `leads`, `accounts`, `contacts`,
  `opportunities`, `activities`, and `dashboard`.

Key endpoints:

- `GET/POST /api/leads`, `POST /api/leads/:id/status`,
  `POST /api/leads/:id/convert`
- `GET/POST /api/accounts`, `GET/POST /api/contacts`
- `GET/POST /api/opportunities`, `POST /api/opportunities/:id/stage`
- `GET/POST /api/activities`
- `GET /api/dashboard/summary`

### Frontend (`client/`)

React Router pages: **Dashboard** (funnel + pipeline stats + recent
activity), **Leads** (list, detail, convert), **Accounts**, **Contacts**,
and **Opportunities** (Kanban board across the pipeline stages with
drag-and-drop, plus a detail page with a stage stepper and transaction/
activity timeline).

## Running locally

```bash
# Terminal 1 — API server (http://localhost:4100)
cd sales-crm/server
npm install
npm run dev

# Terminal 2 — web app (http://localhost:5174)
cd sales-crm/client
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:4100`, so just open
`http://localhost:5174`.

## Notes

- Data is in-memory and resets whenever the server restarts — there's no
  database dependency, so the app runs anywhere Node.js is available.
- The app is seeded with demo leads, accounts, contacts and opportunities
  spanning every pipeline stage so the dashboard and Kanban board aren't
  empty on first load.
