import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/leads", label: "Leads" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/accounts", label: "Accounts" },
  { to: "/contacts", label: "Contacts" },
];

export function Header() {
  return (
    <header className="app-header">
      <div className="brand">📈 Pipeline360</div>
      <nav className="app-nav">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
