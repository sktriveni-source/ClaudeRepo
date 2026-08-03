import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { DashboardSummary } from "../types";
import { StatCard } from "../components/StatCard";
import { PipelineFunnel } from "../components/PipelineFunnel";
import { ActivityTimeline } from "../components/ActivityTimeline";

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.dashboardSummary().then(setSummary);
  }, []);

  if (!summary) return <div className="loading-state">Loading dashboard…</div>;

  const { totals } = summary;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales Pipeline Overview</h1>
          <p className="page-subtitle">Lead engagement through closure, tracked end to end.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn btn-secondary" to="/leads">
            + New Lead
          </Link>
          <Link className="btn btn-primary" to="/opportunities">
            View Pipeline
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Open Leads" value={String(totals.openLeads)} meta={`${totals.leads} total captured`} />
        <StatCard label="Open Opportunities" value={String(totals.openOpportunities)} meta={`${totals.opportunities} total`} />
        <StatCard label="Pipeline Value" value={currency(totals.pipelineValue)} meta={`${currency(totals.weightedPipelineValue)} weighted`} />
        <StatCard label="Won Revenue" value={currency(totals.wonValue)} meta={`${totals.winRate}% win rate`} />
        <StatCard label="Accounts" value={String(totals.accounts)} meta={`${totals.contacts} contacts`} />
        <StatCard label="Lead Conversion" value={`${totals.leadConversionRate}%`} meta="Leads → Opportunities" />
      </div>

      <div className="detail-grid">
        <div className="card card-pad">
          <h2 className="section-title">Lifecycle Funnel</h2>
          <PipelineFunnel steps={summary.pipelineSteps} counts={summary.stageCounts} />
        </div>
        <div className="card card-pad">
          <h2 className="section-title">Recent Activity</h2>
          <ActivityTimeline activities={summary.recentActivity} />
        </div>
      </div>
    </div>
  );
}
