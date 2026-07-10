# RailYatra — Train Schedule & Booking App

A full-stack demo app for browsing train schedules and booking tickets between
four cities: **Bangalore, Mumbai, Delhi and Chennai**.

## Features

- **Search schedules** between any two of the four cities for a given date (each
  train only appears on the days it actually runs).
- **Check seat availability and fares** across four travel classes (Sleeper, AC
  3 Tier, AC 2 Tier, AC First Class).
- **Interactive seat map** to pick specific seats, with a passenger detail form
  per seat.
- **Seat blocking**: selected seats are held for 5 minutes while the passenger
  pays, with a live countdown timer. Held seats are released automatically if
  payment isn't completed in time, or immediately if the booking is cancelled.
- **Mock payment gateway** supporting Card / UPI / Net Banking, including a
  simulated decline path (card numbers ending in `0000`).
- **E-ticket confirmation** with a generated PNR, passenger list, and a
  print/save option.
- **My Bookings** lookup by email, showing the status of every past booking
  (Confirmed / Awaiting Payment / Expired / Cancelled).

## Architecture

```
server/   Express REST API, in-memory data store (no external DB required)
client/   React + TypeScript SPA (Vite), calls the API via /api/* (proxied in dev)
```

### Backend (`server/`)

- `src/data` — static reference data: cities, travel classes, and the train
  timetable (12 routes × 2 trains per direction, with distance-based fares).
- `src/store/db.js` — in-memory seat inventory and booking state machine:
  `BLOCKED → CONFIRMED`, or `BLOCKED → EXPIRED` / `CANCELLED`. Expired holds
  are swept every 30s and also reaped lazily on access.
- `src/routes` — `GET /api/cities`, `GET /api/trains/search`,
  `GET /api/trains/:id/seats`, `POST /api/bookings/block`,
  `POST /api/bookings/:id/payment`, `POST /api/bookings/:id/cancel`,
  `GET /api/bookings?email=`.

### Frontend (`client/`)

React Router pages: Home (search) → Search Results → Seat Selection → Payment
(with countdown) → Confirmation (e-ticket), plus a My Bookings lookup page.

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
- The payment gateway is a mock: any card/UPI ID is accepted except card
  numbers ending in `0000`, which simulate a decline for testing the failure
  path.
