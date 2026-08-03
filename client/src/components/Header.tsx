import { NavLink } from "react-router-dom";

export function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo">SupplyFlow</span>
        <span className="app-header__tagline">Requirement → Raw Materials → Manufacturing → Delivery</span>
      </div>
      <nav className="app-header__nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Dashboard
        </NavLink>
        <NavLink to="/new" className={({ isActive }) => (isActive ? "active" : "")}>
          New Requirement
        </NavLink>
        <NavLink to="/vendors" className={({ isActive }) => (isActive ? "active" : "")}>
          Suppliers & Vendors
        </NavLink>
      </nav>
    </header>
  );
}
