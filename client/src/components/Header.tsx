import { NavLink } from "react-router-dom";
import { PERSONAS, useUser } from "../context/UserContext";

export default function Header() {
  const { persona, setPersona } = useUser();

  return (
    <header className="site-header">
      <div className="brand">
        <span className="brand-mark">PP</span>
        <span className="brand-name">ProductPulse</span>
      </div>
      <nav className="main-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Products
        </NavLink>
        <NavLink to="/approvals" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Approvals
        </NavLink>
      </nav>
      <div className="persona-switcher">
        <label htmlFor="persona-select">Acting as</label>
        <select
          id="persona-select"
          value={persona.name}
          onChange={(e) => {
            const next = PERSONAS.find((p) => p.name === e.target.value);
            if (next) setPersona(next);
          }}
        >
          {PERSONAS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name} — {p.role}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
