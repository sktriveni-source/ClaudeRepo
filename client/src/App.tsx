import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import SearchResultsPage from "./pages/SearchResultsPage";
import SeatSelectionPage from "./pages/SeatSelectionPage";
import PaymentPage from "./pages/PaymentPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import MyBookingsPage from "./pages/MyBookingsPage";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/trains/:trainId/seats" element={<SeatSelectionPage />} />
          <Route path="/booking/:bookingId/payment" element={<PaymentPage />} />
          <Route path="/booking/:bookingId/confirmation" element={<ConfirmationPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="*" element={<div className="state-message">Page not found.</div>} />
        </Routes>
      </main>
      <footer className="site-footer no-print">
        RailYatra demo app · Bangalore · Mumbai · Delhi · Chennai
      </footer>
    </div>
  );
}
