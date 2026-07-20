import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/products", label: "Products" },
  { to: "/change-requests", label: "Change Requests" },
  { to: "/ai-assistant", label: "AI Assistant" },
  { to: "/data-quality", label: "Data Quality" },
  { to: "/duplicates", label: "Duplicate Detection" },
  { to: "/audit", label: "Audit Log", permission: "audit:read" as const },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Layout() {
  const { user, logout, can } = useAuth();
  if (!user) return null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="dot" />
          AI-PLM
        </div>
        <nav>
          {NAV_ITEMS.filter((item) => !item.permission || can(item.permission)).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          Enterprise PLM demo &middot; in-memory data
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <h1>Product Lifecycle Management</h1>
          <div className="user-chip">
            <div className="user-avatar">{initials(user.name)}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{user.name}</div>
              <div className="muted text-sm">{user.roleLabel}</div>
            </div>
            <button className="btn" onClick={logout}>
              Sign out
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
