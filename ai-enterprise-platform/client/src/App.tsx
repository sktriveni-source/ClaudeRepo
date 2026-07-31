import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import HomePage from "./modules/HomePage";

import PlmDashboardPage from "./modules/plm/PlmDashboardPage";
import ProductsPage from "./modules/plm/ProductsPage";
import ProductDetailPage from "./modules/plm/ProductDetailPage";
import ChangeRequestsPage from "./modules/plm/ChangeRequestsPage";
import PlmAssistantPage from "./modules/plm/PlmAssistantPage";

import MdmDashboardPage from "./modules/mdm/MdmDashboardPage";
import DataSourcesPage from "./modules/mdm/DataSourcesPage";
import RecordsPage from "./modules/mdm/RecordsPage";
import IssuesPage from "./modules/mdm/IssuesPage";
import MdmAssistantPage from "./modules/mdm/MdmAssistantPage";

import CrmDashboardPage from "./modules/crm/CrmDashboardPage";
import AccountsPage from "./modules/crm/AccountsPage";
import Customer360Page from "./modules/crm/Customer360Page";
import LeadsPage from "./modules/crm/LeadsPage";
import OpportunitiesPage from "./modules/crm/OpportunitiesPage";
import OpportunityDetailPage from "./modules/crm/OpportunityDetailPage";
import PipelinePage from "./modules/crm/PipelinePage";
import ForecastPage from "./modules/crm/ForecastPage";
import CrmAssistantPage from "./modules/crm/CrmAssistantPage";

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/plm" element={<PlmDashboardPage />} />
          <Route path="/plm/products" element={<ProductsPage />} />
          <Route path="/plm/products/:id" element={<ProductDetailPage />} />
          <Route path="/plm/change-requests" element={<ChangeRequestsPage />} />
          <Route path="/plm/assistant" element={<PlmAssistantPage />} />

          <Route path="/mdm" element={<MdmDashboardPage />} />
          <Route path="/mdm/sources" element={<DataSourcesPage />} />
          <Route path="/mdm/records" element={<RecordsPage />} />
          <Route path="/mdm/issues" element={<IssuesPage />} />
          <Route path="/mdm/assistant" element={<MdmAssistantPage />} />

          <Route path="/crm" element={<CrmDashboardPage />} />
          <Route path="/crm/accounts" element={<AccountsPage />} />
          <Route path="/crm/accounts/:id" element={<Customer360Page />} />
          <Route path="/crm/leads" element={<LeadsPage />} />
          <Route path="/crm/opportunities" element={<OpportunitiesPage />} />
          <Route path="/crm/opportunities/:id" element={<OpportunityDetailPage />} />
          <Route path="/crm/pipeline" element={<PipelinePage />} />
          <Route path="/crm/forecast" element={<ForecastPage />} />
          <Route path="/crm/assistant" element={<CrmAssistantPage />} />

          <Route path="*" element={<div className="content state-message">Page not found.</div>} />
        </Routes>
      </div>
    </div>
  );
}
