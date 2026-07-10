import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchTrains, ApiRequestError } from "../api/client";
import type { SearchResult } from "../types";
import TrainCard from "../components/TrainCard";

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function SearchResultsPage() {
  const [params, setParams] = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const date = params.get("date") || "";

  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!from || !to || !date) return;
    setLoading(true);
    setError("");
    searchTrains(from, to, date)
      .then(setResult)
      .catch((err: ApiRequestError) => setError(err.message || "Search failed"))
      .finally(() => setLoading(false));
  }, [from, to, date]);

  if (!from || !to || !date) {
    return (
      <div className="state-message">
        Missing search criteria. <Link to="/">Go back to search</Link>.
      </div>
    );
  }

  return (
    <div>
      <div className="results-meta">
        <div>
          <h1 className="page-title">
            {result ? `${result.from.name} → ${result.to.name}` : "Searching…"}
          </h1>
          {result && (
            <p className="page-subtitle">
              {new Date(`${date}T12:00:00`).toDateString()} ({result.weekday})
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setParams({ from, to, date: shiftDate(date, -1) })}>
            ← Previous day
          </button>
          <button className="btn btn-outline" onClick={() => setParams({ from, to, date: shiftDate(date, 1) })}>
            Next day →
          </button>
        </div>
      </div>

      {loading && (
        <div className="state-message">
          <div className="spinner" />
          Loading trains…
        </div>
      )}

      {!loading && error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && result && result.trains.length === 0 && (
        <div className="state-message">
          No trains run on this route on {result.weekday}. Try another date.
        </div>
      )}

      {!loading && !error && result && result.trains.length > 0 && (
        <div className="train-list">
          {result.trains.map((train) => (
            <TrainCard key={train.id} train={train} date={date} />
          ))}
        </div>
      )}
    </div>
  );
}
