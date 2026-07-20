import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/data-sources", label: "Data Sources" },
  { to: "/profiling", label: "Profiling" },
  { to: "/rules", label: "Validation Rules" },
  { to: "/duplicates", label: "Duplicate Detection" },
  { to: "/issues", label: "Issue Management" },
  { to: "/approvals", label: "Approvals" },
  { to: "/ask-ai", label: "Ask the Data (AI)" },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="brand">
        <span className="brand-mark">DT</span>
        <div>
          <div className="brand-name">DataTrust MDM</div>
          <div className="brand-sub">Enterprise Data Quality</div>
        </div>
      </div>
      <ul>
        {links.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
