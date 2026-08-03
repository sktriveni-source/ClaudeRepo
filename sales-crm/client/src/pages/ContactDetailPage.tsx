import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import type { Contact } from "../types";
import { StageBadge } from "../components/StageBadge";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { ActivityForm } from "../components/ActivityForm";

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const navigate = useNavigate();

  function reload() {
    if (!id) return;
    api.getContact(id).then(setContact);
  }
  useEffect(reload, [id]);

  if (!contact) return <div className="loading-state">Loading contact…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="page-subtitle">
            {contact.title ? `${contact.title} · ` : ""}
            {contact.account ? (
              <Link to={`/accounts/${contact.account.id}`} style={{ color: "var(--primary)" }}>
                {contact.account.name}
              </Link>
            ) : (
              "No account linked"
            )}
          </p>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Contact Details</h2>
            <div className="info-row">
              <span className="label">Email</span>
              <span>{contact.email || "—"}</span>
            </div>
            <div className="info-row">
              <span className="label">Phone</span>
              <span>{contact.phone || "—"}</span>
            </div>
            <div className="info-row">
              <span className="label">Lead Source</span>
              <span>{contact.leadSource || "—"}</span>
            </div>
            <div className="info-row">
              <span className="label">Owner</span>
              <span>{contact.owner}</span>
            </div>
          </div>

          <div className="card card-pad">
            <h2 className="section-title">Opportunities ({contact.opportunities?.length || 0})</h2>
            {!contact.opportunities || contact.opportunities.length === 0 ? (
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
                  {contact.opportunities.map((o) => (
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
          <ActivityForm relatedType="Contact" relatedId={contact.id} owner={contact.owner} onLogged={reload} />
          <ActivityTimeline activities={contact.activities || []} />
        </div>
      </div>
    </div>
  );
}
