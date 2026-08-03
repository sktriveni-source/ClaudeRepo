import { FormEvent, useState } from "react";
import { api } from "../api/client";

export function ActivityForm({
  relatedType,
  relatedId,
  owner,
  onLogged,
}: {
  relatedType: "Lead" | "Account" | "Contact" | "Opportunity";
  relatedId: string;
  owner?: string;
  onLogged: () => void;
}) {
  const [type, setType] = useState("Call");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    setSaving(true);
    try {
      await api.createActivity({ relatedType, relatedId, type, subject, description, owner: owner || "You" });
      setSubject("");
      setDescription("");
      onLogged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option>Call</option>
          <option>Email</option>
          <option>Meeting</option>
          <option>Note</option>
        </select>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="Subject, e.g. Follow-up call"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <textarea
        className="input"
        placeholder="Notes (optional)"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div>
        <button type="submit" className="btn btn-secondary btn-sm" disabled={saving || !subject.trim()}>
          {saving ? "Logging…" : "Log activity"}
        </button>
      </div>
    </form>
  );
}
