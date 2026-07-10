export interface City {
  id: string;
  name: string;
  station: string;
}

export interface TrainClass {
  id: string;
  label: string;
  coach: string;
  totalSeats: number;
  seatsPerRow: number;
  fare: number;
  available?: number;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  arrivalDayOffset: number;
  durationMinutes: number;
  duration: string;
  distanceKm: number;
  days: string[];
  classes: TrainClass[];
}

export interface SearchResult {
  from: City;
  to: City;
  date: string;
  weekday: string;
  trains: Train[];
}

export type SeatStatus = "AVAILABLE" | "BLOCKED" | "BOOKED";

export interface Seat {
  seatNumber: string;
  coach: string;
  status: SeatStatus;
}

export interface SeatMapResponse {
  trainId: string;
  date: string;
  classId: string;
  seatsPerRow: number;
  fare: number;
  seats: Seat[];
}

export interface Passenger {
  name: string;
  age: number;
  gender: "M" | "F" | "O";
}

export type BookingStatus = "BLOCKED" | "CONFIRMED" | "EXPIRED" | "CANCELLED";

export interface Payment {
  method: string;
  reference: string;
  paidAt: string;
  amount: number;
}

export interface Booking {
  id: string;
  pnr: string | null;
  trainId: string;
  date: string;
  classId: string;
  seatNumbers: string[];
  passengers: Passenger[];
  contactEmail: string;
  contactPhone: string;
  fare: number;
  status: BookingStatus;
  blockExpiresAt: number;
  createdAt: string;
  updatedAt: string;
  payment: Payment | null;
  train: {
    id: string;
    number: string;
    name: string;
    departure: string;
    arrival: string;
    duration: string;
  };
  from: City;
  to: City;
  className: string;
}

export interface ApiError {
  error: string;
  code?: string;
}
