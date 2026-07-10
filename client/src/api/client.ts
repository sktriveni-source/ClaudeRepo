import type { Booking, City, Passenger, SearchResult, SeatMapResponse, Train } from "../types";

const BASE = "/api";

class ApiRequestError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiRequestError(body.error || "Request failed", res.status, body.code);
  }
  return body as T;
}

export { ApiRequestError };

export function getCities(): Promise<City[]> {
  return request("/cities");
}

export function searchTrains(from: string, to: string, date: string): Promise<SearchResult> {
  const params = new URLSearchParams({ from, to, date });
  return request(`/trains/search?${params.toString()}`);
}

export function getTrain(trainId: string): Promise<Train> {
  return request(`/trains/${trainId}`);
}

export function getSeatMap(trainId: string, classId: string, date: string): Promise<SeatMapResponse> {
  const params = new URLSearchParams({ classId, date });
  return request(`/trains/${trainId}/seats?${params.toString()}`);
}

export interface BlockSeatsPayload {
  trainId: string;
  date: string;
  classId: string;
  seatNumbers: string[];
  passengers: Passenger[];
  contactEmail: string;
  contactPhone: string;
}

export function blockSeats(payload: BlockSeatsPayload): Promise<Booking> {
  return request("/bookings/block", { method: "POST", body: JSON.stringify(payload) });
}

export function getBooking(bookingId: string): Promise<Booking> {
  return request(`/bookings/${bookingId}`);
}

export interface PaymentPayload {
  method: "CARD" | "UPI" | "NETBANKING";
  cardNumber?: string;
  cardName?: string;
  expiry?: string;
  cvv?: string;
  upiId?: string;
}

export function payForBooking(bookingId: string, payload: PaymentPayload): Promise<Booking> {
  return request(`/bookings/${bookingId}/payment`, { method: "POST", body: JSON.stringify(payload) });
}

export function cancelBooking(bookingId: string): Promise<Booking> {
  return request(`/bookings/${bookingId}/cancel`, { method: "POST" });
}

export function listBookingsByEmail(email: string): Promise<Booking[]> {
  const params = new URLSearchParams({ email });
  return request(`/bookings?${params.toString()}`);
}
