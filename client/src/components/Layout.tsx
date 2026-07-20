import { NavLink, Outlet } from "react-router-dom";

const NAV = [
  { group: null, items: [{ to: "/", label: "Dashboard", end: true }] },
  {
    group: "Customers",
    items: [
      { to: "/customers/accounts", label: "Accounts" },
      { to: "/customers/contacts", label: "Contacts" },
    ],
  },
  {
    group: "Sales",
    items: [
      { to: "/sales/leads", label: "Leads" },
      { to: "/sales/opportunities", label: "Opportunities" },
      { to: "/sales/pipeline", label: "Pipeline" },
      { to: "/sales/forecast", label: "Forecast" },
    ],
  },
  {
    group: "Activities",
    items: [{ to: "/activities", label: "Activities Timeline" }],
  },
  {
    group: null,
    items: [
      { to: "/ai-assistant", label: "AI Sales Assistant" },
      { to: "/reports", label: "Reports" },
      { to: "/administration", label: "Administration" },
    ],
  },
];

export function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          AI-Powered Sales CRM
          <span>Customer Intelligence Platform</span>
        </div>
        {NAV.map((section, idx) => (
          <div className="nav-group" key={idx}>
            {section.group && <div className="nav-group-label">{section.group}</div>}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : false}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
