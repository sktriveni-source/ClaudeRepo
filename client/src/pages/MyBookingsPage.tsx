import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listBookingsByEmail, ApiRequestError } from "../api/client";
import type { Booking } from "../types";
import StatusBadge from "../components/StatusBadge";

const CONTACT_EMAIL_KEY = "railyatra.contactEmail";

export default function MyBookingsPage() {
  const [email, setEmail] = useState(() => localStorage.getItem(CONTACT_EMAIL_KEY) || "");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    localStorage.setItem(CONTACT_EMAIL_KEY, email);
    listBookingsByEmail(email)
      .then(setBookings)
      .catch((err: ApiRequestError) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (email) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function targetLink(b: Booking) {
    if (b.status === "BLOCKED") return `/booking/${b.id}/payment`;
    return `/booking/${b.id}/confirmation`;
  }

  return (
    <div>
      <h1 className="page-title">My bookings</h1>
      <p className="page-subtitle">Look up bookings using the email you provided while booking.</p>

      <form className="card" onSubmit={search} style={{ display: "flex", gap: 12, alignItems: "end" }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Searching…" : "Find bookings"}
        </button>
      </form>

      {error && <div className="alert alert-danger" style={{ marginTop: 16 }}>{error}</div>}

      {bookings && bookings.length === 0 && (
        <div className="state-message">No bookings found for this email.</div>
      )}

      {bookings && bookings.length > 0 && (
        <div className="train-list" style={{ marginTop: 20 }}>
          {bookings.map((b) => (
            <Link key={b.id} to={targetLink(b)} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card train-card">
                <div className="train-card-header">
                  <div>
                    <div className="train-name">
                      {b.train.name} <span className="train-number">#{b.train.number}</span>
                    </div>
                    <div className="train-days">
                      {b.from.name} → {b.to.name} · {b.date} · {b.className}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="train-days">
                  Seats {b.seatNumbers.join(", ")} · ₹{b.fare}
                  {b.pnr ? ` · PNR ${b.pnr}` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
