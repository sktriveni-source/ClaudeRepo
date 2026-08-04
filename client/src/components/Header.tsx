import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../api/client";

export function Header() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    function refresh() {
      api
        .listApprovals("PENDING")
        .then((list) => setPendingCount(list.length))
        .catch(() => {});
    }
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

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
        <NavLink to="/approvals" className={({ isActive }) => (isActive ? "active" : "")}>
          Approvals
          {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
        </NavLink>
      </nav>
    </header>
  );
}
