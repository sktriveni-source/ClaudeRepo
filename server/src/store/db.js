import { trainById } from "../data/trains.js";
import { classById } from "../data/classes.js";
import { generatePNR } from "../utils/pnr.js";

export const BLOCK_TTL_MS = 5 * 60 * 1000; // seats held for 5 minutes while paying

// seatKey -> { status: 'BLOCKED' | 'BOOKED', bookingId, blockExpiresAt }
const seatStatus = new Map();
// bookingId -> booking record
const bookings = new Map();

function seatKey(trainId, date, classId, seatNumber) {
  return `${trainId}|${date}|${classId}|${seatNumber}`;
}

function seatNumbersForClass(classId) {
  const cls = classById[classId];
  if (!cls) throw new Error(`Unknown class ${classId}`);
  return Array.from({ length: cls.totalSeats }, (_, i) => `${cls.coach}-${i + 1}`);
}

/** Lazily releases a seat entry if its hold has expired. */
function reapIfExpired(key) {
  const entry = seatStatus.get(key);
  if (entry && entry.status === "BLOCKED" && entry.blockExpiresAt < Date.now()) {
    seatStatus.delete(key);
    const booking = bookings.get(entry.bookingId);
    if (booking && booking.status === "BLOCKED") {
      booking.status = "EXPIRED";
      booking.updatedAt = new Date().toISOString();
    }
    return true;
  }
  return false;
}

export function sweepExpiredHolds() {
  for (const key of seatStatus.keys()) {
    reapIfExpired(key);
  }
}

export function getSeatMap(trainId, date, classId) {
  const train = trainById[trainId];
  if (!train) throw new Error("Train not found");
  const cls = train.classes.find((c) => c.id === classId);
  if (!cls) throw new Error("Class not found on train");

  return seatNumbersForClass(classId).map((seatNumber) => {
    const key = seatKey(trainId, date, classId, seatNumber);
    reapIfExpired(key);
    const entry = seatStatus.get(key);
    return {
      seatNumber,
      coach: cls.coach,
      status: entry ? entry.status : "AVAILABLE",
    };
  });
}

export function getAvailability(trainId, date, classId) {
  const seats = getSeatMap(trainId, date, classId);
  return seats.filter((s) => s.status === "AVAILABLE").length;
}

export class BookingError extends Error {
  constructor(message, code = "BOOKING_ERROR") {
    super(message);
    this.code = code;
  }
}

export function blockSeats({ trainId, date, classId, seatNumbers, passengers, contactEmail, contactPhone }) {
  const train = trainById[trainId];
  if (!train) throw new BookingError("Train not found", "NOT_FOUND");
  const cls = train.classes.find((c) => c.id === classId);
  if (!cls) throw new BookingError("Class not found on train", "NOT_FOUND");
  if (!seatNumbers?.length) throw new BookingError("Select at least one seat", "INVALID_INPUT");
  if (seatNumbers.length !== passengers?.length) {
    throw new BookingError("Passenger details must match number of seats", "INVALID_INPUT");
  }

  const keys = seatNumbers.map((s) => seatKey(trainId, date, classId, s));

  // Validate all requested seats are currently free before mutating anything.
  for (const key of keys) {
    reapIfExpired(key);
    if (seatStatus.has(key)) {
      throw new BookingError("One or more selected seats are no longer available", "SEAT_TAKEN");
    }
  }

  const now = Date.now();
  const bookingId = `BK-${now}-${Math.random().toString(36).slice(2, 8)}`;
  const blockExpiresAt = now + BLOCK_TTL_MS;

  keys.forEach((key) => {
    seatStatus.set(key, { status: "BLOCKED", bookingId, blockExpiresAt });
  });

  const fare = cls.fare * seatNumbers.length;
  const booking = {
    id: bookingId,
    pnr: null,
    trainId,
    date,
    classId,
    seatNumbers,
    passengers,
    contactEmail,
    contactPhone,
    fare,
    status: "BLOCKED",
    blockExpiresAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payment: null,
  };
  bookings.set(bookingId, booking);
  return booking;
}

export function getBooking(bookingId) {
  const booking = bookings.get(bookingId);
  if (!booking) throw new BookingError("Booking not found", "NOT_FOUND");
  if (booking.status === "BLOCKED") {
    const key0 = seatKey(booking.trainId, booking.date, booking.classId, booking.seatNumbers[0]);
    reapIfExpired(key0);
  }
  return booking;
}

export function listBookingsByEmail(email) {
  return Array.from(bookings.values())
    .filter((b) => b.contactEmail?.toLowerCase() === email.toLowerCase())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function payForBooking(bookingId, paymentDetails) {
  const booking = getBooking(bookingId);
  if (booking.status === "EXPIRED") {
    throw new BookingError("Seat hold expired before payment was completed", "EXPIRED");
  }
  if (booking.status === "CANCELLED") {
    throw new BookingError("Booking was cancelled", "CANCELLED");
  }
  if (booking.status !== "BLOCKED") {
    throw new BookingError("Booking is not awaiting payment", "INVALID_STATE");
  }

  // Simple mock payment gateway: card numbers ending in 0000 simulate a decline.
  const declined = paymentDetails?.method === "CARD" && /0000$/.test(paymentDetails?.cardNumber || "");
  if (declined) {
    throw new BookingError("Payment was declined by the bank. Please try another method.", "PAYMENT_DECLINED");
  }

  const keys = booking.seatNumbers.map((s) => seatKey(booking.trainId, booking.date, booking.classId, s));
  keys.forEach((key) => {
    seatStatus.set(key, { status: "BOOKED", bookingId: booking.id });
  });

  booking.status = "CONFIRMED";
  booking.pnr = generatePNR();
  booking.payment = {
    method: paymentDetails?.method || "CARD",
    reference: `PAY-${Date.now().toString(36).toUpperCase()}`,
    paidAt: new Date().toISOString(),
    amount: booking.fare,
  };
  booking.updatedAt = new Date().toISOString();
  return booking;
}

export function cancelBooking(bookingId) {
  const booking = getBooking(bookingId);
  if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
    return booking;
  }
  const keys = booking.seatNumbers.map((s) => seatKey(booking.trainId, booking.date, booking.classId, s));
  keys.forEach((key) => seatStatus.delete(key));
  booking.status = "CANCELLED";
  booking.updatedAt = new Date().toISOString();
  return booking;
}
