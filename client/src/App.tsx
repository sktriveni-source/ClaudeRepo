import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import DataSourcesPage from "./pages/DataSourcesPage";
import ProfilingPage from "./pages/ProfilingPage";
import RulesPage from "./pages/RulesPage";
import DuplicatesPage from "./pages/DuplicatesPage";
import IssuesPage from "./pages/IssuesPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import AskAIPage from "./pages/AskAIPage";

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/data-sources" element={<DataSourcesPage />} />
          <Route path="/profiling" element={<ProfilingPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/duplicates" element={<DuplicatesPage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/ask-ai" element={<AskAIPage />} />
        </Routes>
      </main>
    </div>
  );
}
