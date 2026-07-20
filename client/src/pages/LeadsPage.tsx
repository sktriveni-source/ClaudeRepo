import { Fragment, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Lead } from "../types";
import { LeadStatusBadge } from "../components/StatusBadge";

const STATUSES = ["New", "Contacted", "Qualified", "Converted", "Disqualified"];

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ companyName: "", contactName: "", email: "", leadSource: "Website", industry: "", companySize: "500", engagementScore: "40" });

  function load() {
    api.getLeads(status ? { status } : undefined).then(setLeads);
  }

  useEffect(load, [status]);

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    await api.createLead({ ...form, companySize: Number(form.companySize) as unknown as number, engagementScore: Number(form.engagementScore) as unknown as number });
    setShowForm(false);
    setForm({ companyName: "", contactName: "", email: "", leadSource: "Website", industry: "", companySize: "500", engagementScore: "40" });
    load();
  }

  async function qualify(id: string, qualified: boolean) {
    await api.qualifyLead(id, qualified);
    load();
  }

  async function convert(id: string) {
    await api.convertLead(id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Leads</h1>
          <div className="page-subtitle">{leads.length} leads · AI lead scoring applied</div>
        </div>
        <button className="primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New Lead"}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} onSubmit={createLead}>
          <input placeholder="Company name" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          <input placeholder="Contact name" required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select value={form.leadSource} onChange={(e) => setForm({ ...form, leadSource: e.target.value })}>
            <option>Website</option>
            <option>Referral</option>
            <option>Marketing Campaign</option>
            <option>Trade Show</option>
            <option>Partner</option>
            <option>Webinar</option>
            <option>Cold Outreach</option>
          </select>
          <input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <input type="number" placeholder="Company size" value={form.companySize} onChange={(e) => setForm({ ...form, companySize: e.target.value })} />
          <button className="primary" type="submit">
            Save Lead
          </button>
        </form>
      )}

      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Source</th>
              <th>Status</th>
              <th>AI Score</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <Fragment key={l.leadId}>
                <tr>
                  <td>{l.companyName}</td>
                  <td>{l.contactName}</td>
                  <td>{l.leadSource}</td>
                  <td>
                    <LeadStatusBadge status={l.leadStatus} />
                  </td>
                  <td>
                    <button
                      onClick={() => setExpanded(expanded === l.leadId ? null : l.leadId)}
                      style={{ padding: "3px 10px", fontWeight: 700 }}
                      title="Show scoring reasons"
                    >
                      {l.aiScore}/100
                    </button>
                  </td>
                  <td>{l.ownerName}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    {l.leadStatus === "New" || l.leadStatus === "Contacted" ? (
                      <>
                        <button onClick={() => qualify(l.leadId, true)}>Qualify</button>
                        <button onClick={() => qualify(l.leadId, false)}>Disqualify</button>
                      </>
                    ) : null}
                    {l.leadStatus === "Qualified" && (
                      <button className="primary" onClick={() => convert(l.leadId)}>
                        Convert
                      </button>
                    )}
                  </td>
                </tr>
                {expanded === l.leadId && (
                  <tr>
                    <td colSpan={7} style={{ background: "var(--page-plane)" }}>
                      <div className="ai-insight" style={{ margin: "4px 0" }}>
                        <span className="ai-insight-icon">✨</span>
                        <div>
                          <strong>{l.aiRecommendation}</strong> — Reasons: {l.aiReasons?.join(", ")}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
