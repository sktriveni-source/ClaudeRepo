import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import StatCard from "../components/StatCard";
import { useApi } from "../hooks/useApi";
import { crmApi, mdmApi, plmApi } from "../api/client";
import { LoadingState } from "../components/StateMessages";

export default function HomePage() {
  const plm = useApi(plmApi.dashboard, []);
  const mdm = useApi(mdmApi.dashboard, []);
  const crm = useApi(crmApi.dashboard, []);

  return (
    <>
      <TopBar title="Platform Overview" subtitle="PLM · MDM · Sales CRM" />
      <div className="content">
        <div className="section">
          <p className="page-subtitle">
            One AI-enabled enterprise platform covering product lifecycle management, master data quality, and the
            full sales CRM lifecycle — from lead to renewal.
          </p>
        </div>

        <div className="module-tiles section">
          <Link to="/plm" className="module-tile plm">
            <div className="tile-icon">📦</div>
            <h3>Product Lifecycle Management</h3>
            <p>Central product repository, documents, change requests, and AI-assisted product search.</p>
            {plm.loading || !plm.data ? (
              <LoadingState label="Loading…" />
            ) : (
              <div className="grid grid-3">
                <StatCard label="Products" value={plm.data.totalProducts} />
                <StatCard label="Open CRs" value={plm.data.openChangeRequests} />
                <StatCard label="Compliance flags" value={plm.data.complianceReviewNeeded} />
              </div>
            )}
          </Link>

          <Link to="/mdm" className="module-tile mdm">
            <div className="tile-icon">🧹</div>
            <h3>Master Data Management</h3>
            <p>Data profiling, duplicate detection, validation rules, and cleansing workflows.</p>
            {mdm.loading || !mdm.data ? (
              <LoadingState label="Loading…" />
            ) : (
              <div className="grid grid-3">
                <StatCard label="Avg. quality" value={`${mdm.data.averageQualityScore}%`} />
                <StatCard label="Open issues" value={mdm.data.openIssues} />
                <StatCard label="Sources" value={mdm.data.totalSources} />
              </div>
            )}
          </Link>

          <Link to="/crm" className="module-tile crm">
            <div className="tile-icon">💼</div>
            <h3>Sales CRM &amp; Customer Intelligence</h3>
            <p>Customer 360, lead scoring, opportunity risk, forecasting, and the AI Sales Assistant.</p>
            {crm.loading || !crm.data ? (
              <LoadingState label="Loading…" />
            ) : (
              <div className="grid grid-3">
                <StatCard label="Open pipeline" value={`$${(crm.data.totalPipeline / 1_000_000).toFixed(1)}M`} />
                <StatCard label="Weighted" value={`$${(crm.data.weightedPipeline / 1_000_000).toFixed(1)}M`} />
                <StatCard label="Accounts" value={crm.data.totalAccounts} />
              </div>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
