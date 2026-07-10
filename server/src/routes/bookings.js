import { Router } from "express";
import { trainById } from "../data/trains.js";
import { cityById } from "../data/cities.js";
import {
  blockSeats,
  payForBooking,
  getBooking,
  cancelBooking,
  listBookingsByEmail,
  BookingError,
} from "../store/db.js";

export const bookingsRouter = Router();

function enrich(booking) {
  const train = trainById[booking.trainId];
  const cls = train.classes.find((c) => c.id === booking.classId);
  return {
    ...booking,
    train: {
      id: train.id,
      number: train.number,
      name: train.name,
      departure: train.departure,
      arrival: train.arrival,
      duration: train.duration,
    },
    from: cityById[train.from],
    to: cityById[train.to],
    className: cls.label,
  };
}

function handleBookingError(res, err) {
  if (err instanceof BookingError) {
    const statusByCode = {
      NOT_FOUND: 404,
      INVALID_INPUT: 400,
      SEAT_TAKEN: 409,
      EXPIRED: 410,
      CANCELLED: 409,
      INVALID_STATE: 409,
      PAYMENT_DECLINED: 402,
    };
    return res.status(statusByCode[err.code] || 400).json({ error: err.message, code: err.code });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}

bookingsRouter.post("/block", (req, res) => {
  const { trainId, date, classId, seatNumbers, passengers, contactEmail, contactPhone } = req.body || {};

  if (!trainId || !trainById[trainId]) {
    return res.status(400).json({ error: "Unknown trainId" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });
  }
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return res.status(400).json({ error: "A valid contactEmail is required" });
  }

  try {
    const booking = blockSeats({ trainId, date, classId, seatNumbers, passengers, contactEmail, contactPhone });
    res.status(201).json(enrich(booking));
  } catch (err) {
    handleBookingError(res, err);
  }
});

bookingsRouter.get("/:id", (req, res) => {
  try {
    const booking = getBooking(req.params.id);
    res.json(enrich(booking));
  } catch (err) {
    handleBookingError(res, err);
  }
});

bookingsRouter.get("/", (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email query param is required" });
  res.json(listBookingsByEmail(email).map(enrich));
});

bookingsRouter.post("/:id/payment", (req, res) => {
  try {
    const booking = payForBooking(req.params.id, req.body || {});
    res.json(enrich(booking));
  } catch (err) {
    handleBookingError(res, err);
  }
});

bookingsRouter.post("/:id/cancel", (req, res) => {
  try {
    const booking = cancelBooking(req.params.id);
    res.json(enrich(booking));
  } catch (err) {
    handleBookingError(res, err);
  }
});
