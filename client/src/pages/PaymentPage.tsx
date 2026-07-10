import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBooking, payForBooking, ApiRequestError } from "../api/client";
import type { Booking } from "../types";
import type { PaymentPayload } from "../api/client";
import BookingTimer from "../components/BookingTimer";
import StatusBadge from "../components/StatusBadge";

type Method = PaymentPayload["method"];

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<Method>("CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [paying, setPaying] = useState(false);

  const refresh = useCallback(() => {
    if (!bookingId) return;
    getBooking(bookingId)
      .then(setBooking)
      .catch((err: ApiRequestError) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingId) return;
    setError("");

    const payload: PaymentPayload =
      method === "CARD"
        ? { method, cardNumber: cardNumber.replace(/\s/g, ""), cardName, expiry, cvv }
        : method === "UPI"
        ? { method, upiId }
        : { method };

    if (method === "CARD" && (!cardNumber || !cardName || !expiry || !cvv)) {
      setError("Fill in all card details");
      return;
    }
    if (method === "UPI" && !upiId) {
      setError("Enter your UPI ID");
      return;
    }

    setPaying(true);
    try {
      const updated = await payForBooking(bookingId, payload);
      navigate(`/booking/${updated.id}/confirmation`);
    } catch (err) {
      const apiErr = err as ApiRequestError;
      setError(apiErr.message || "Payment failed. Please try again.");
      if (apiErr.code === "EXPIRED") refresh();
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="state-message">
        <div className="spinner" />
        Loading booking…
      </div>
    );
  }

  if (!booking) {
    return <div className="alert alert-danger">{error || "Booking not found"}</div>;
  }

  if (booking.status === "EXPIRED") {
    return (
      <div className="card">
        <h1 className="page-title">Seat hold expired</h1>
        <p>Your 5-minute hold on these seats has expired and they have been released.</p>
        <Link className="btn btn-primary" to={`/search?from=${booking.from.id}&to=${booking.to.id}&date=${booking.date}`}>
          Search again
        </Link>
      </div>
    );
  }

  if (booking.status !== "BLOCKED") {
    return (
      <div className="card">
        <h1 className="page-title">This booking already has a status of: <StatusBadge status={booking.status} /></h1>
        {booking.status === "CONFIRMED" && (
          <Link className="btn btn-primary" to={`/booking/${booking.id}/confirmation`}>
            View ticket
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Complete payment</h1>
      <p className="page-subtitle">
        {booking.train.name} #{booking.train.number} · {booking.className} · Seats {booking.seatNumbers.join(", ")}
      </p>

      <BookingTimer expiresAt={booking.blockExpiresAt} onExpire={refresh} />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="two-col">
        <form className="card" onSubmit={handlePay}>
          <div className="pay-tabs">
            {(["CARD", "UPI", "NETBANKING"] as Method[]).map((m) => (
              <button
                type="button"
                key={m}
                className={`pay-tab ${method === m ? "active" : ""}`}
                onClick={() => setMethod(m)}
              >
                {m === "CARD" ? "Card" : m === "UPI" ? "UPI" : "Net Banking"}
              </button>
            ))}
          </div>

          {method === "CARD" && (
            <>
              <div className="field">
                <label>Card number</label>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 1111 1111 1234"
                  maxLength={19}
                  required
                />
              </div>
              <div className="field" style={{ marginTop: 10 }}>
                <label>Name on card</label>
                <input value={cardName} onChange={(e) => setCardName(e.target.value)} required />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Expiry (MM/YY)</label>
                  <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="12/29" required />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>CVV</label>
                  <input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={4}
                    type="password"
                    required
                  />
                </div>
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                Demo gateway: any card works, except numbers ending in 0000 (simulates a decline).
              </p>
            </>
          )}

          {method === "UPI" && (
            <div className="field">
              <label>UPI ID</label>
              <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@bank" required />
            </div>
          )}

          {method === "NETBANKING" && (
            <p style={{ color: "var(--color-text-muted)" }}>
              You will be redirected to your bank's net banking portal in a live integration. This demo confirms
              instantly.
            </p>
          )}

          <button
            type="submit"
            className="btn btn-accent btn-block"
            style={{ marginTop: 18 }}
            disabled={paying || booking.blockExpiresAt < Date.now()}
          >
            {paying ? "Processing payment…" : `Pay ₹${booking.fare}`}
          </button>
        </form>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Order summary</h2>
          <div className="summary-row">
            <span>Route</span>
            <span>
              {booking.from.name} → {booking.to.name}
            </span>
          </div>
          <div className="summary-row">
            <span>Date</span>
            <span>{booking.date}</span>
          </div>
          <div className="summary-row">
            <span>Class</span>
            <span>{booking.className}</span>
          </div>
          <div className="summary-row">
            <span>Passengers</span>
            <span>{booking.passengers.length}</span>
          </div>
          <div className="summary-row total">
            <span>Amount payable</span>
            <span>₹{booking.fare}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
