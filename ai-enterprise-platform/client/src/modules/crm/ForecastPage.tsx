import TopBar from "../../components/TopBar";
import StatCard from "../../components/StatCard";
import { useApi } from "../../hooks/useApi";
import { crmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

export default function ForecastPage() {
  const { data, loading, error } = useApi(crmApi.forecast, []);

  const attainment = data && data.salesTarget > 0 ? Math.round((data.weightedPipeline / data.salesTarget) * 100) : 0;
  const belowTarget = data ? data.weightedPipeline < data.salesTarget * 0.85 : false;

  return (
    <>
      <TopBar title="Sales Forecast" subtitle="CRM · Forecasting" />
      <div className="content">
        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {data && (
          <>
            <div className="card section">
              <table className="data-table">
                <tbody>
                  <tr><td>Sales Target</td><td><strong>${data.salesTarget.toLocaleString()}</strong></td></tr>
                  <tr><td>Total Pipeline</td><td>${data.totalPipeline.toLocaleString()}</td></tr>
                  <tr><td>Weighted Pipeline</td><td>${data.weightedPipeline.toLocaleString()}</td></tr>
                  <tr><td>Committed (≥70% probability)</td><td>${data.committed.toLocaleString()}</td></tr>
                  <tr><td>Best Case</td><td>${data.bestCase.toLocaleString()}</td></tr>
                  <tr><td>Closed Won</td><td>${data.closedWon.toLocaleString()}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-3 section">
              <StatCard label="Weighted vs. Target" value={`${attainment}%`} />
              <StatCard label="Gap to Target" value={`$${Math.max(0, data.salesTarget - data.weightedPipeline).toLocaleString()}`} />
              <StatCard label="Closed Won %" value={`${data.salesTarget > 0 ? Math.round((data.closedWon / data.salesTarget) * 100) : 0}%`} />
            </div>

            <div className="ai-panel section">
              <div className="ai-panel-header"><span className="spark">✦</span> AI Forecast Insight</div>
              <div className="ai-insight-box">
                {belowTarget
                  ? `The current weighted pipeline ($${data.weightedPipeline.toLocaleString()}) is below the level historically required to achieve the quarterly sales target ($${data.salesTarget.toLocaleString()}). Review the Opportunities view for at-risk deals and prioritize opportunities with no recent activity.`
                  : `The current weighted pipeline is tracking well against the quarterly sales target. Continue monitoring at-risk opportunities to protect forecast accuracy.`}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
