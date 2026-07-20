import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Contact } from "../types";

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api.getContacts(q ? { q } : undefined).then(setContacts);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Contacts</h1>
          <div className="page-subtitle">{contacts.length} contacts across all accounts</div>
        </div>
      </div>

      <div className="toolbar">
        <input type="search" placeholder="Search contacts…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Account</th>
              <th>Job Title</th>
              <th>Role</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.contactId}>
                <td>
                  {c.firstName} {c.lastName}
                </td>
                <td>
                  <Link to={`/customers/accounts/${c.accountId}`}>{c.accountName}</Link>
                </td>
                <td>{c.jobTitle}</td>
                <td>{c.decisionMakingRole}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
