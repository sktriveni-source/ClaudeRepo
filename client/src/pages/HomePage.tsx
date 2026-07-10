import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCities } from "../api/client";
import type { City } from "../types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const POPULAR_ROUTES = [
  { from: "BLR", to: "BOM" },
  { from: "BLR", to: "DEL" },
  { from: "BOM", to: "DEL" },
  { from: "DEL", to: "MAA" },
  { from: "BLR", to: "MAA" },
  { from: "BOM", to: "MAA" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [from, setFrom] = useState("BLR");
  const [to, setTo] = useState("BOM");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");

  useEffect(() => {
    getCities().then(setCities).catch(() => setError("Could not load cities"));
  }, []);

  const cityName = (id: string) => cities.find((c) => c.id === id)?.name || id;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (from === to) {
      setError("Origin and destination must be different");
      return;
    }
    setError("");
    navigate(`/search?from=${from}&to=${to}&date=${date}`);
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div>
      <h1 className="page-title">Find your train</h1>
      <p className="page-subtitle">Search schedules and availability between Bangalore, Mumbai, Delhi and Chennai.</p>

      <div className="card">
        {error && <div className="alert alert-danger">{error}</div>}
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="from">From</label>
            <select id="from" value={from} onChange={(e) => setFrom(e.target.value)}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="swap-btn" onClick={swap} aria-label="Swap cities" title="Swap cities">
            ⇄
          </button>

          <div className="field">
            <label htmlFor="to">To</label>
            <select id="to" value={to} onChange={(e) => setTo(e.target.value)}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="date">Date of journey</label>
            <input
              id="date"
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Search Trains
          </button>
        </form>
      </div>

      <div className="popular-routes">
        <strong>Popular routes</strong>
        <div className="route-chip-row">
          {POPULAR_ROUTES.map((r) => (
            <button
              key={`${r.from}-${r.to}`}
              className="route-chip"
              onClick={() => {
                setFrom(r.from);
                setTo(r.to);
              }}
            >
              {cityName(r.from)} → {cityName(r.to)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
