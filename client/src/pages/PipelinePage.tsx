import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { PipelineStage, SalesUser } from "../types";
import { PipelineFunnel } from "../components/PipelineFunnel";
import { money } from "../components/KpiCard";

const REGIONS = ["Europe", "Americas", "APAC"];

export function PipelinePage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [users, setUsers] = useState<SalesUser[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [region, setRegion] = useState("");

  function load() {
    const params: Record<string, string> = {};
    if (ownerId) params.ownerId = ownerId;
    if (region) params.region = region;
    api.getPipeline(params).then(setStages);
  }

  useEffect(load, [ownerId, region]);
  useEffect(() => {
    api.getSalesUsers().then(setUsers);
  }, []);

  const totalValue = stages.reduce((s, st) => s + st.value, 0);
  const totalWeighted = stages.reduce((s, st) => s + st.weightedValue, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales Pipeline</h1>
          <div className="page-subtitle">
            Total pipeline {money(totalValue)} · Weighted {money(totalWeighted)}
          </div>
        </div>
      </div>

      <div className="toolbar">
        <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          <option value="">All sales representatives</option>
          {users.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.name}
            </option>
          ))}
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">All regions</option>
          {REGIONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <PipelineFunnel stages={stages} />
      </div>
    </div>
  );
}
