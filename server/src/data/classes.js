// Travel classes offered on every train, with per-km fare rate and seat
// inventory per coach. Kept intentionally small so the seat map renders
// as a single easy-to-scan grid in the UI.
export const CLASS_DEFS = [
  { id: "SL", label: "Sleeper", ratePerKm: 0.55, totalSeats: 30, coach: "S1", seatsPerRow: 6 },
  { id: "3A", label: "AC 3 Tier", ratePerKm: 1.35, totalSeats: 24, coach: "B1", seatsPerRow: 6 },
  { id: "2A", label: "AC 2 Tier", ratePerKm: 1.9, totalSeats: 18, coach: "A1", seatsPerRow: 4 },
  { id: "1A", label: "AC First Class", ratePerKm: 3.2, totalSeats: 12, coach: "H1", seatsPerRow: 4 },
];

export const classById = Object.fromEntries(CLASS_DEFS.map((c) => [c.id, c]));
