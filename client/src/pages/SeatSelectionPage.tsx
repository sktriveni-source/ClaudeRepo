import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { blockSeats, getSeatMap, getTrain, ApiRequestError } from "../api/client";
import type { Passenger, SeatMapResponse, Train } from "../types";
import SeatMap from "../components/SeatMap";

const MAX_SEATS = 6;
const CONTACT_EMAIL_KEY = "railyatra.contactEmail";

export default function SeatSelectionPage() {
  const { trainId } = useParams<{ trainId: string }>();
  const [params] = useSearchParams();
  const classId = params.get("classId") || "";
  const date = params.get("date") || "";
  const navigate = useNavigate();

  const [train, setTrain] = useState<Train | null>(null);
  const [seatMap, setSeatMap] = useState<SeatMapResponse | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [contactEmail, setContactEmail] = useState(() => localStorage.getItem(CONTACT_EMAIL_KEY) || "");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!trainId || !classId || !date) return;
    setLoading(true);
    Promise.all([getTrain(trainId), getSeatMap(trainId, classId, date)])
      .then(([t, sm]) => {
        setTrain(t);
        setSeatMap(sm);
      })
      .catch((err: ApiRequestError) => setError(err.message))
      .finally(() => setLoading(false));
  }, [trainId, classId, date]);

  useEffect(() => {
    setPassengers((prev) => {
      const next = selected.map((_, i) => prev[i] || { name: "", age: 0, gender: "M" as const });
      return next;
    });
  }, [selected]);

  function toggleSeat(seatNumber: string) {
    setSelected((prev) =>
      prev.includes(seatNumber) ? prev.filter((s) => s !== seatNumber) : [...prev, seatNumber]
    );
  }

  function updatePassenger(index: number, field: keyof Passenger, value: string) {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: field === "age" ? Number(value) : value } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trainId) return;
    setError("");

    if (selected.length === 0) {
      setError("Select at least one seat to continue");
      return;
    }
    if (passengers.some((p) => !p.name.trim() || !p.age || p.age <= 0)) {
      setError("Enter a valid name and age for every passenger");
      return;
    }
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setError("Enter a valid contact email");
      return;
    }
    if (!contactPhone || contactPhone.trim().length < 10) {
      setError("Enter a valid 10-digit contact phone number");
      return;
    }

    setSubmitting(true);
    try {
      localStorage.setItem(CONTACT_EMAIL_KEY, contactEmail);
      const booking = await blockSeats({
        trainId,
        date,
        classId,
        seatNumbers: selected,
        passengers,
        contactEmail,
        contactPhone,
      });
      navigate(`/booking/${booking.id}/payment`);
    } catch (err) {
      const apiErr = err as ApiRequestError;
      setError(apiErr.message || "Could not block seats. Please try again.");
      if (apiErr.code === "SEAT_TAKEN" && trainId) {
        getSeatMap(trainId, classId, date).then(setSeatMap);
        setSelected([]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="state-message">
        <div className="spinner" />
        Loading seat availability…
      </div>
    );
  }

  if (error && !train) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!train || !seatMap) return null;

  const cls = train.classes.find((c) => c.id === classId)!;
  const totalFare = cls.fare * selected.length;

  return (
    <div>
      <p>
        <Link to={`/search?from=${train.from}&to=${train.to}&date=${date}`}>&larr; Back to results</Link>
      </p>
      <h1 className="page-title">
        {train.name} <span className="train-number">#{train.number}</span>
      </h1>
      <p className="page-subtitle">
        {cls.label} · {train.from} {train.departure} → {train.to} {train.arrival} · {date}
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="two-col">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Choose your seats (max {MAX_SEATS})</h2>
          <SeatMap
            seats={seatMap.seats}
            seatsPerRow={seatMap.seatsPerRow}
            selected={selected}
            maxSelectable={MAX_SEATS}
            onToggle={toggleSeat}
          />

          {selected.length > 0 && (
            <>
              <h2 style={{ fontSize: "1.05rem" }}>Passenger details</h2>
              {selected.map((seat, i) => (
                <div className="passenger-card" key={seat}>
                  <strong>Seat {seat}</strong>
                  <div className="passenger-grid" style={{ marginTop: 8 }}>
                    <div className="field">
                      <label>Full name</label>
                      <input
                        value={passengers[i]?.name || ""}
                        onChange={(e) => updatePassenger(i, "name", e.target.value)}
                        placeholder="As per ID proof"
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Age</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={passengers[i]?.age || ""}
                        onChange={(e) => updatePassenger(i, "age", e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Gender</label>
                      <select
                        value={passengers[i]?.gender || "M"}
                        onChange={(e) => updatePassenger(i, "gender", e.target.value)}
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <form className="card" onSubmit={handleSubmit}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Booking summary</h2>
          <div className="summary-row">
            <span>Class</span>
            <span>{cls.label}</span>
          </div>
          <div className="summary-row">
            <span>Fare per seat</span>
            <span>₹{cls.fare}</span>
          </div>
          <div className="summary-row">
            <span>Seats selected</span>
            <span>{selected.length || "—"}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{totalFare}</span>
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label>Contact email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>Contact phone</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="10-digit mobile number"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: 18 }}
            disabled={submitting || selected.length === 0}
          >
            {submitting ? "Blocking seats…" : `Block ${selected.length || ""} seat(s) & proceed`}
          </button>
          <p className="page-subtitle" style={{ fontSize: "0.8rem", marginTop: 10, marginBottom: 0 }}>
            Seats are held for 5 minutes while you complete payment.
          </p>
        </form>
      </div>
    </div>
  );
}
