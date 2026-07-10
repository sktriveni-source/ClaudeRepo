import { useNavigate } from "react-router-dom";
import type { Train } from "../types";

interface Props {
  train: Train;
  date: string;
}

function availabilityClass(available: number, total: number) {
  if (available === 0) return "none";
  if (available / total <= 0.25) return "low";
  return "";
}

export default function TrainCard({ train, date }: Props) {
  const navigate = useNavigate();

  return (
    <div className="card train-card">
      <div className="train-card-header">
        <div>
          <div className="train-name">
            {train.name} <span className="train-number">#{train.number}</span>
          </div>
          <div className="train-days">Runs on: {train.days.join(", ")}</div>
        </div>
        <div className="train-days">Distance: {train.distanceKm} km</div>
      </div>

      <div className="train-timing">
        <div className="timing-block">
          <div className="timing-time">{train.departure}</div>
          <div className="timing-city">{train.from}</div>
        </div>
        <div className="timing-line">
          {train.duration}
          <hr />
          {train.arrivalDayOffset > 0 ? `+${train.arrivalDayOffset}d` : "same day"}
        </div>
        <div className="timing-block">
          <div className="timing-time">{train.arrival}</div>
          <div className="timing-city">{train.to}</div>
        </div>
      </div>

      <div className="class-row">
        {train.classes.map((cls) => {
          const available = cls.available ?? 0;
          const soldOut = available === 0;
          return (
            <button
              key={cls.id}
              className="class-pill"
              disabled={soldOut}
              onClick={() =>
                navigate(`/trains/${train.id}/seats?classId=${cls.id}&date=${date}`)
              }
            >
              <span className="class-pill-label">{cls.label}</span>
              <span className="class-pill-fare">₹{cls.fare}</span>
              <span className={`class-pill-avail ${availabilityClass(available, cls.totalSeats)}`}>
                {soldOut ? "Sold out" : `${available} seats left`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
