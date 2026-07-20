import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { QueryResult, SalesUser } from "../types";

interface Message {
  role: "user" | "ai";
  text: string;
  records?: QueryResult["records"];
}

const SUGGESTIONS = [
  "Show my opportunities closing this month",
  "Which customers have not been contacted in 30 days?",
  "Which opportunities are at risk?",
  "What should I focus on today?",
];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hi! I'm your AI Sales Assistant. Ask me about your pipeline, customers, or what to focus on today. I only answer from data you're authorized to see, with links back to the underlying records.",
    },
  ]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState<SalesUser[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getSalesUsers().then(setUsers);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function ask(question: string) {
    if (!question.trim()) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    const result = await api.aiQuery(question, ownerId || undefined);
    setMessages((m) => [...m, { role: "ai", text: result.answer, records: result.records }]);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Sales Assistant</h1>
          <div className="page-subtitle">Ask natural-language questions about your CRM data</div>
        </div>
        <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          <option value="">Ask about all opportunities</option>
          {users.map((u) => (
            <option key={u.userId} value={u.userId}>
              Ask as {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="chat-panel">
        <div className="chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              <div>{m.text}</div>
              {m.records && m.records.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                  {m.records.map((r) => (
                    <Link key={r.id} to={r.link} style={{ fontSize: 12.5 }}>
                      → {r.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="chat-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
        <form
          className="chat-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input placeholder="Ask about your customers, pipeline, or next steps…" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="primary" type="submit">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
