import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">🚆</span>
          RailYatra
        </Link>
        <nav className="site-nav">
          <Link to="/">Search Trains</Link>
          <Link to="/my-bookings">My Bookings</Link>
        </nav>
      </div>
    </header>
  );
}
