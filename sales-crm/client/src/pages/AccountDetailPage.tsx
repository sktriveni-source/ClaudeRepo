import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Account } from "../types";
import { StageBadge } from "../components/StageBadge";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { ActivityForm } from "../components/ActivityForm";

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const navigate = useNavigate();

  function reload() {
    if (!id) return;
    api.getAccount(id).then(setAccount);
  }
  useEffect(reload, [id]);

  if (!account) return <div className="loading-state">Loading account…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{account.name}</h1>
          <p className="page-subtitle">
            {account.industry} {account.billingCity ? `· ${account.billingCity}` : ""}
          </p>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Account Details</h2>
            <div className="info-row">
              <span className="label">Website</span>
              <span>{account.website || "—"}</span>
            </div>
            <div className="info-row">
              <span className="label">Phone</span>
              <span>{account.phone || "—"}</span>
            </div>
            <div className="info-row">
              <span className="label">Owner</span>
              <span>{account.owner}</span>
            </div>
          </div>

          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Contacts ({account.contacts?.length || 0})</h2>
            {!account.contacts || account.contacts.length === 0 ? (
              <div className="empty-state">No contacts linked yet.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Title</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {account.contacts.map((c) => (
                    <tr key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}>
                      <td>
                        {c.firstName} {c.lastName}
                      </td>
                      <td>{c.title || "—"}</td>
                      <td>{c.email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card card-pad">
            <h2 className="section-title">Opportunities ({account.opportunities?.length || 0})</h2>
            {!account.opportunities || account.opportunities.length === 0 ? (
              <div className="empty-state">No opportunities linked yet.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Stage</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {account.opportunities.map((o) => (
                    <tr key={o.id} onClick={() => navigate(`/opportunities/${o.id}`)}>
                      <td>{o.name}</td>
                      <td>
                        <StageBadge value={o.stage} />
                      </td>
                      <td>{currency(o.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card card-pad">
          <h2 className="section-title">Activity</h2>
          <ActivityForm relatedType="Account" relatedId={account.id} owner={account.owner} onLogged={reload} />
          <ActivityTimeline activities={account.activities || []} />
        </div>
      </div>
    </div>
  );
}
