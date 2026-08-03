import { useState, type FormEvent } from "react";
import type { Stage, StageId } from "../types";
import Modal from "./Modal";

interface Props {
  stages: Stage[];
  current: StageId;
  defaultTarget?: StageId;
  onSubmit: (toStage: StageId, comment: string) => Promise<void>;
  onClose: () => void;
}

export default function StageChangeForm({ stages, current, defaultTarget, onSubmit, onClose }: Props) {
  const options = stages.filter((s) => s.id !== current);
  const [toStage, setToStage] = useState<StageId>(defaultTarget ?? options[0]?.id);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentOrder = stages.find((s) => s.id === current)?.order ?? 0;
  const targetOrder = stages.find((s) => s.id === toStage)?.order ?? 0;
  const isSkip = Math.abs(targetOrder - currentOrder) > 1;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(toStage, comment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Request lifecycle stage change" onClose={onClose}>
      <form onSubmit={handleSubmit} className="stacked-form">
        {error && <div className="form-error">{error}</div>}
        <label>
          Move to stage
          <select value={toStage} onChange={(e) => setToStage(e.target.value as StageId)}>
            {options.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {isSkip && (
          <div className="form-warning">
            This skips over intermediate stages — the approver will see this flagged.
          </div>
        )}
        <label>
          Justification / comment
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Why is this product ready to move?"
          />
        </label>
        <p className="hint-text">
          This request goes to the Approvals inbox and will not take effect until an approver signs off.
        </p>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Submitting…" : "Submit for approval"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
