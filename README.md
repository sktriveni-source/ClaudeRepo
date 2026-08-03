# SupplyFlow — Supply Process Flow App

A full-stack demo app that models an end-to-end supply chain process: capturing
a customer's product requirement, procuring raw materials, manufacturing the
product, and distributing it back to the customer.

## The process flow

Every **Requirement Order** starts when a customer's product requirement is
captured, then moves through two sequential phases:

**1. Raw Material Procurement**

```
Place Order → Sourcing (suppliers/vendors) → RFQ → Order → Goods Receipt → Invoice
```

**2. Manufacturing & Distribution**

```
Place Order → External Vendor / In-house Unit → RFQ (external only) → Place Order
  → Order Complete → Inventory → Distribution → Delivery → Goods Receipt
  → Invoice → Billing → Close Requirement Order
```

Raw materials must be fully received and invoiced before the manufacturing
order can be placed. Manufacturing can go to an **external vendor** (RFQ
raised, quotes compared, order placed with the accepted bidder) or an
**in-house manufacturing unit** (RFQ step is skipped, job order placed
directly). Once billing is complete, the requirement order is closed.

## Architecture

```
server/   Express REST API, in-memory data store (no external DB required)
client/   React + TypeScript SPA (Vite), calls the API via /api/* (proxied in dev)
```

### Backend (`server/`)

- `src/data/vendors.js` — seed directory of raw-material suppliers and
  manufacturing vendors.
- `src/store/db.js` — in-memory state machine for requirement orders. Each
  order tracks a `rawMaterial` stage and a `manufacturing` stage, and every
  transition is validated (e.g. you can't record a goods receipt before a
  purchase order exists) and appended to the order's `timeline`.
- `src/routes/vendors.js` — `GET /api/vendors`, `POST /api/vendors`.
- `src/routes/orders.js` — `GET/POST /api/orders`, `GET /api/orders/:id`, plus
  one action endpoint per stage transition, e.g.
  `POST /api/orders/:id/raw-material/sourcing`,
  `POST /api/orders/:id/raw-material/rfq/:rfqId/accept`,
  `POST /api/orders/:id/manufacturing/mode`,
  `POST /api/orders/:id/manufacturing/distribution`,
  `POST /api/orders/:id/close`.

### Frontend (`client/`)

React Router pages:

- **Dashboard** (`/`) — every requirement order with its current phase/stage.
- **New Requirement** (`/new`) — capture customer, product, quantity, specs
  and the raw materials needed.
- **Order Detail** (`/orders/:id`) — two stage steppers (raw materials,
  manufacturing) plus an action panel for whatever stage the order is
  currently in: select suppliers, raise/quote/accept RFQs, record goods
  receipts and invoices, choose external vs. in-house manufacturing, dispatch
  shipments, record delivery/billing, and close the order. A timeline at the
  bottom logs every transition.
- **Suppliers & Vendors** (`/vendors`) — directory of raw-material suppliers
  and manufacturing vendors used when raising RFQs.

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
- Stage transitions are enforced server-side: each action endpoint checks the
  order is at the expected stage before applying it, so the UI and API can't
  drift out of sync.
