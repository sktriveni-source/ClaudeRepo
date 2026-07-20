import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { LifecycleBadge, ComplianceBadge, CRStatusBadge } from "../components/StatusBadge";
import type { AiQueryResult } from "../types";

interface Message {
  role: "user" | "ai";
  text: string;
  result?: AiQueryResult;
}

const SUGGESTIONS = [
  "Show products approaching end-of-life with unresolved change requests",
  "Which products are non-compliant?",
  "Find likely duplicate products",
  "What data quality issues need attention?",
  "Show electronics products",
];

export function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text:
        "Ask me about product lifecycle status, compliance, change requests, duplicates, or data quality. Try one of the suggestions below, or ask your own question.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    if (!question.trim() || busy) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const result = await api.aiQuery(question);
      setMessages((m) => [...m, { role: "ai", text: result.answer, result }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: e instanceof Error ? e.message : "Something went wrong." }]);
    } finally {
      setBusy(false);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 50);
    }
  }

  return (
    <div className="card chat-panel">
      <div className="card-title">AI Assistant &middot; product information retrieval</div>
      <div className="chat-messages" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            <div>{m.text}</div>
            {m.result && <ResultDisplay result={m.result} />}
          </div>
        ))}
        {busy && <div className="chat-bubble ai muted">Thinking...</div>}
      </div>

      <div className="flex-row" style={{ flexWrap: "wrap", marginBottom: 4 }}>
        {SUGGESTIONS.map((s) => (
          <span key={s} className="suggestion-chip" onClick={() => send(s)}>
            {s}
          </span>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          placeholder="Ask about products, compliance, change requests..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
        />
        <button className="btn primary" onClick={() => send(input)} disabled={busy}>
          Send
        </button>
      </div>
    </div>
  );
}

function ResultDisplay({ result }: { result: AiQueryResult }) {
  return (
    <div>
      {result.products.length > 0 && (
        <div>
          {result.products.map((p) => (
            <div key={p.id} className="result-card">
              <div className="title">
                <Link to={`/products/${p.id}`}>{p.name}</Link>
              </div>
              <div className="meta">{p.code} &middot; {p.category} &middot; owner: {p.owner || "unassigned"}</div>
              <div className="flex-row" style={{ marginTop: 6 }}>
                <LifecycleBadge stage={p.lifecycleStage} />
                <ComplianceBadge status={p.complianceStatus} />
                {p.eolDate && <span className="badge amber">EOL {p.eolDate}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {result.changeRequests.length > 0 && (
        <div>
          {result.changeRequests.map((cr) => (
            <div key={cr.id} className="result-card">
              <div className="title">{cr.title}</div>
              <div className="meta">{cr.description}</div>
              <div className="flex-row" style={{ marginTop: 6 }}>
                <CRStatusBadge status={cr.status} />
                <span className="muted text-sm">requested by {cr.requestedBy}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {result.documents.length > 0 && (
        <div>
          {result.documents.map((d) => (
            <div key={d.id} className="result-card">
              <div className="title">{d.name}</div>
              <div className="meta">{d.type} &middot; v{d.version}</div>
              <p className="text-sm" style={{ marginTop: 6 }}>{d.content.slice(0, 220)}...</p>
            </div>
          ))}
        </div>
      )}

      {result.duplicates && result.duplicates.length > 0 && (
        <div>
          {result.duplicates.map((dup, i) => (
            <div key={i} className="result-card">
              <div className="title">
                {dup.productA.name} &harr; {dup.productB.name}
              </div>
              <div className="meta">
                {dup.reason} &middot; similarity {(dup.similarity * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {result.qualityIssues && result.qualityIssues.length > 0 && (
        <div>
          {result.qualityIssues.map((issue, i) => (
            <div key={i} className="result-card">
              <div className="title">
                <Link to={`/products/${issue.productId}`}>{issue.productName}</Link> &mdash; {issue.issue}
              </div>
              <div className="meta">{issue.recommendation}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
