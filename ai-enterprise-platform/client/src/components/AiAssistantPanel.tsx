import { useState } from "react";
import type { AiAnswer } from "../types";

interface Props {
  title: string;
  placeholder: string;
  suggestions: string[];
  onAsk: (question: string) => Promise<AiAnswer>;
}

export default function AiAssistantPanel({ title, placeholder, suggestions, onAsk }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AiAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await onAsk(q);
      setAnswer(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <span className="spark">✦</span>
        {title}
      </div>
      <form
        className="ai-query-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input
          type="text"
          placeholder={placeholder}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>
      <div className="ai-suggestions">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className="ai-suggestion-chip"
            onClick={() => {
              setQuestion(s);
              ask(s);
            }}
          >
            {s}
          </button>
        ))}
      </div>
      {error && <div className="ai-answer" style={{ color: "var(--danger)" }}>{error}</div>}
      {answer && !error && (
        <div className="ai-answer">
          {answer.answer}
          <span className="source-tag">
            {answer.source === "claude-opus-5" ? "Answered by Claude Opus 5" : "Answered by rule-based fallback (set ANTHROPIC_API_KEY for AI-generated answers)"}
          </span>
        </div>
      )}
    </div>
  );
}
