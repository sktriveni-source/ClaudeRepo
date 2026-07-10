import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBooking, cancelBooking, ApiRequestError } from "../api/client";
import type { Booking } from "../types";
import StatusBadge from "../components/StatusBadge";

export default function ConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    getBooking(bookingId)
      .then(setBooking)
      .catch((err: ApiRequestError) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  async function handleCancel() {
    if (!bookingId) return;
    setCancelling(true);
    try {
      const updated = await cancelBooking(bookingId);
      setBooking(updated);
    } catch (err) {
      setError((err as ApiRequestError).message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="state-message">
        <div className="spinner" />
        Loading ticket…
      </div>
    );
  }

  if (!booking) {
    return <div className="alert alert-danger">{error || "Booking not found"}</div>;
  }

  if (booking.status !== "CONFIRMED") {
    return (
      <div className="card">
        <h1 className="page-title">
          Booking status: <StatusBadge status={booking.status} />
        </h1>
        {booking.status === "BLOCKED" && (
          <Link className="btn btn-primary" to={`/booking/${booking.id}/payment`}>
            Continue to payment
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Booking confirmed</h1>
      <p className="page-subtitle">A copy of this ticket has been recorded against {booking.contactEmail}.</p>

      <div className="ticket">
        <div className="ticket-header">
          <div>
            <div className="train-name">
              {booking.train.name} <span className="train-number">#{booking.train.number}</span>
            </div>
            <div className="train-days">{booking.className}</div>
          </div>
          <div className="pnr-box">
            <div className="ticket-field-label">PNR</div>
            <div className="pnr-value">{booking.pnr}</div>
          </div>
        </div>

        <div className="ticket-grid">
          <div>
            <div className="ticket-field-label">From</div>
            <div className="ticket-field-value">
              {booking.from.name} · {booking.train.departure}
            </div>
          </div>
          <div>
            <div className="ticket-field-label">To</div>
            <div className="ticket-field-value">
              {booking.to.name} · {booking.train.arrival}
            </div>
          </div>
          <div>
            <div className="ticket-field-label">Date of journey</div>
            <div className="ticket-field-value">{booking.date}</div>
          </div>
          <div>
            <div className="ticket-field-label">Duration</div>
            <div className="ticket-field-value">{booking.train.duration}</div>
          </div>
          <div>
            <div className="ticket-field-label">Seats</div>
            <div className="ticket-field-value">{booking.seatNumbers.join(", ")}</div>
          </div>
          <div>
            <div className="ticket-field-label">Fare paid</div>
            <div className="ticket-field-value">₹{booking.fare}</div>
          </div>
        </div>

        <table className="passenger-table">
          <thead>
            <tr>
              <th>Passenger</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Seat</th>
            </tr>
          </thead>
          <tbody>
            {booking.passengers.map((p, i) => (
              <tr key={i}>
                <td>{p.name}</td>
                <td>{p.age}</td>
                <td>{p.gender}</td>
                <td>{booking.seatNumbers[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {booking.payment && (
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: 14 }}>
            Paid via {booking.payment.method} · Ref {booking.payment.reference} ·{" "}
            {new Date(booking.payment.paidAt).toLocaleString()}
          </p>
        )}
      </div>

      {error && <div className="alert alert-danger" style={{ marginTop: 16 }}>{error}</div>}

      <div className="actions-row no-print">
        <button className="btn btn-primary" onClick={() => window.print()}>
          Print / Save ticket
        </button>
        <button className="btn btn-outline" onClick={handleCancel} disabled={cancelling}>
          {cancelling ? "Cancelling…" : "Cancel booking"}
        </button>
        <Link className="btn btn-outline" to="/">
          Book another train
        </Link>
      </div>
    </div>
  );
}
