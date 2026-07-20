import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { AccountsPage } from "./pages/AccountsPage";
import { AccountDetailPage } from "./pages/AccountDetailPage";
import { ContactsPage } from "./pages/ContactsPage";
import { LeadsPage } from "./pages/LeadsPage";
import { OpportunitiesPage } from "./pages/OpportunitiesPage";
import { OpportunityDetailPage } from "./pages/OpportunityDetailPage";
import { PipelinePage } from "./pages/PipelinePage";
import { ForecastPage } from "./pages/ForecastPage";
import { ActivitiesPage } from "./pages/ActivitiesPage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AdministrationPage } from "./pages/AdministrationPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="customers/accounts" element={<AccountsPage />} />
        <Route path="customers/accounts/:id" element={<AccountDetailPage />} />
        <Route path="customers/contacts" element={<ContactsPage />} />
        <Route path="sales/leads" element={<LeadsPage />} />
        <Route path="sales/opportunities" element={<OpportunitiesPage />} />
        <Route path="sales/opportunities/:id" element={<OpportunityDetailPage />} />
        <Route path="sales/pipeline" element={<PipelinePage />} />
        <Route path="sales/forecast" element={<ForecastPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="ai-assistant" element={<AIAssistantPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="administration" element={<AdministrationPage />} />
      </Route>
    </Routes>
  );
}
