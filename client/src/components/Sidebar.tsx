import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) => `sidebar-link${isActive ? " active" : ""}`;

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="logo-mark">AI</span>
        AI-Enterprise Platform
      </div>

      <NavLink to="/" end className={linkClass}>
        🏠 Home
      </NavLink>

      <div className="sidebar-section">PLM</div>
      <NavLink to="/plm" end className={linkClass}>
        📊 Dashboard
      </NavLink>
      <NavLink to="/plm/products" className={linkClass}>
        📦 Products
      </NavLink>
      <NavLink to="/plm/change-requests" className={linkClass}>
        🔁 Change Requests
      </NavLink>
      <NavLink to="/plm/assistant" className={linkClass}>
        ✦ AI Assistant
      </NavLink>

      <div className="sidebar-section">MDM</div>
      <NavLink to="/mdm" end className={linkClass}>
        📊 Dashboard
      </NavLink>
      <NavLink to="/mdm/sources" className={linkClass}>
        🔌 Data Sources
      </NavLink>
      <NavLink to="/mdm/records" className={linkClass}>
        🗂 Records
      </NavLink>
      <NavLink to="/mdm/issues" className={linkClass}>
        ⚠️ Issues
      </NavLink>
      <NavLink to="/mdm/assistant" className={linkClass}>
        ✦ AI Assistant
      </NavLink>

      <div className="sidebar-section">Sales CRM</div>
      <NavLink to="/crm" end className={linkClass}>
        📊 Dashboard
      </NavLink>
      <NavLink to="/crm/accounts" className={linkClass}>
        🏢 Accounts
      </NavLink>
      <NavLink to="/crm/leads" className={linkClass}>
        🎯 Leads
      </NavLink>
      <NavLink to="/crm/opportunities" className={linkClass}>
        💼 Opportunities
      </NavLink>
      <NavLink to="/crm/pipeline" className={linkClass}>
        📈 Pipeline
      </NavLink>
      <NavLink to="/crm/forecast" className={linkClass}>
        🔮 Forecast
      </NavLink>
      <NavLink to="/crm/assistant" className={linkClass}>
        ✦ AI Sales Assistant
      </NavLink>

      <div className="sidebar-footer">Portfolio demo · v1.0</div>
    </nav>
  );
}
