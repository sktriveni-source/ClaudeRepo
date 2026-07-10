import type { Seat } from "../types";

interface Props {
  seats: Seat[];
  seatsPerRow: number;
  selected: string[];
  maxSelectable: number;
  onToggle: (seatNumber: string) => void;
}

export default function SeatMap({ seats, seatsPerRow, selected, maxSelectable, onToggle }: Props) {
  return (
    <div>
      <div className="seat-legend">
        <span className="seat-legend-item">
          <span className="legend-swatch" style={{ background: "white", border: "1px solid #e1e5ee" }} />
          Available
        </span>
        <span className="seat-legend-item">
          <span className="legend-swatch" style={{ background: "#0d5c9e" }} />
          Selected
        </span>
        <span className="seat-legend-item">
          <span className="legend-swatch" style={{ background: "#eceff5" }} />
          Booked / Held
        </span>
      </div>

      <div className="seat-map" style={{ gridTemplateColumns: `repeat(${seatsPerRow}, 46px)` }}>
        {seats.map((seat) => {
          const isSelected = selected.includes(seat.seatNumber);
          const isTaken = seat.status !== "AVAILABLE";
          const atLimit = !isSelected && selected.length >= maxSelectable;
          return (
            <button
              key={seat.seatNumber}
              type="button"
              className={`seat-btn ${isTaken ? "taken" : "available"} ${isSelected ? "selected" : ""}`}
              disabled={isTaken || atLimit}
              title={isTaken ? "Not available" : seat.seatNumber}
              onClick={() => onToggle(seat.seatNumber)}
            >
              {seat.seatNumber.split("-")[1]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
