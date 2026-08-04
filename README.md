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

## Approval workflow

Eight of the stages — **RFQ, Order, Goods Receipt, Invoice, Inventory,
Distribution, Delivery and Billing** — are approval-gated in both phases
wherever they occur. Submitting one of these doesn't change the order
immediately:

1. **Submit** — filling in the form (e.g. accepting a supplier's quote,
   recording a goods receipt, entering an invoice) creates a `PENDING`
   approval request with a snapshot of the submitted data, and the order is
   locked (only one approval can be in flight per order at a time).
2. **Approve** — an approver reviews the request and decides. Approving
   executes the underlying transition (creates the PO, records the receipt,
   advances the stage, ...); rejecting discards it and leaves the order
   exactly where it was, so the requester can correct and resubmit.

The RFQ→Order step is deliberately split into two separate approvals
(accepting a vendor's quote, then placing the purchase/manufacturing order
against it), matching the two arrows in the original flow diagram.
Sourcing/RFQ-raising, marking a manufacturing order complete, paying a
supplier invoice, and closing the order are administrative steps and stay
ungated.

Approvals can be actioned from two places: inline on the order (a banner
replaces the action panel while something is pending) or from the
**Approvals** dashboard (`/approvals`), which lists every pending approval
across all orders in one place — the pattern for "managing" the approval
flow centrally rather than order-by-order.

## Architecture

```
server/   Express REST API, in-memory data store (no external DB required)
client/   React + TypeScript SPA (Vite), calls the API via /api/* (proxied in dev)
```

### Backend (`server/`)

- `src/data/vendors.js` — seed directory of raw-material suppliers and
  manufacturing vendors.
- `src/store/db.js` — in-memory state machine for requirement orders. Each
  order tracks a `rawMaterial` stage and a `manufacturing` stage. Gated
  transitions go through a generic `requestApproval` / `decideApproval` pair:
  the requested action and its payload are held in `order.pendingApproval`
  until approved (which runs the matching executor) or rejected (which
  discards it). Every event — direct actions, submissions, approvals,
  rejections and the resulting business action — is appended to
  `order.transactions`, a full structured audit ledger (timestamp, phase,
  stage, category, type, actor, message, amount, reference id). Decided
  approvals accumulate in `order.approvals` for a full history.
- `src/routes/vendors.js` — `GET /api/vendors`, `POST /api/vendors`.
- `src/routes/approvals.js` — `GET /api/approvals?status=PENDING`, a global
  view across every order's approvals.
- `src/routes/orders.js` — `GET/POST /api/orders`, `GET /api/orders/:id`, an
  order-scoped `GET /api/orders/:id/approvals` and
  `POST /api/orders/:id/approvals/:approvalId/decide`, plus one action
  endpoint per stage transition — ungated ones apply immediately (e.g.
  `POST /api/orders/:id/raw-material/sourcing`), gated ones submit for
  approval (e.g. `POST /api/orders/:id/raw-material/rfq/:rfqId/accept`,
  `POST /api/orders/:id/raw-material/order/place`,
  `POST /api/orders/:id/manufacturing/inventory`,
  `POST /api/orders/:id/manufacturing/billing`).

### Frontend (`client/`)

React Router pages:

- **Dashboard** (`/`) — every requirement order with its current phase/stage.
- **New Requirement** (`/new`) — capture customer, product, quantity, specs
  and the raw materials needed.
- **Order Detail** (`/orders/:id`) — an "Acting as" field attributes your
  actions; two stage steppers (raw materials, manufacturing); either the
  action panel for the current stage or, while something is pending, an
  approval banner with approve/reject controls; an **Approval History**
  table and a full **Transaction Ledger** table underneath.
- **Approvals** (`/approvals`) — every pending approval across all orders in
  one place, with inline approve/reject. The nav bar shows a live pending
  count badge.
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
