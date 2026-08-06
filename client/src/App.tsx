import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ApiRequestError, requestTeardown } from "./api/client";

const EXAMPLE_IDEAS = [
  "A subscription box that sends home cooks a curated set of regional spices with recipe cards each month.",
  "An app that uses your phone's camera to identify houseplants and tells you exactly when to water them based on local weather.",
  "A marketplace connecting retired engineers with startups that need a few hours of expert consulting per week.",
];

const MAX_LENGTH = 4000;

export default function App() {
  const [idea, setIdea] = useState("");
  const [teardown, setTeardown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = idea.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setTeardown(null);
    try {
      const result = await requestTeardown(trimmed);
      setTeardown(result.teardown);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Something went wrong. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <span className="brand">
            <span className="brand-mark">🔎</span>
            Reality Check
          </span>
          <span className="tagline">A rapid feasibility pre-mortem for your idea</span>
        </div>
      </header>

      <main className="main-content">
        <div className="card intro-card">
          <h1 className="page-title">Is this idea worth your time?</h1>
          <p className="page-subtitle">
            Describe your business idea, invention, or creative project in one paragraph. You'll get a
            blunt, structured teardown — competitors, likely failure modes, the one assumption everything
            rests on, and three cheap experiments to run before you spend real money.
          </p>

          <form onSubmit={handleSubmit}>
            <textarea
              className="idea-input"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A subscription box that sends home cooks a curated set of regional spices with recipe cards each month..."
              maxLength={MAX_LENGTH}
              rows={6}
              disabled={loading}
            />
            <div className="input-footer">
              <span className="char-count">
                {idea.length} / {MAX_LENGTH}
              </span>
              <button type="submit" className="btn btn-primary" disabled={loading || !idea.trim()}>
                {loading ? "Running the teardown…" : "Reality-check this idea"}
              </button>
            </div>
          </form>

          {!teardown && !loading && (
            <div className="examples">
              <span className="examples-label">Try an example:</span>
              <div className="example-chip-row">
                {EXAMPLE_IDEAS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="example-chip"
                    onClick={() => setIdea(example)}
                  >
                    {example.length > 60 ? `${example.slice(0, 60)}…` : example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="state-message card">
            <div className="spinner" />
            Researching competitors and stress-testing the idea…
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {teardown && !loading && (
          <div className="card teardown-card">
            <ReactMarkdown>{teardown}</ReactMarkdown>
          </div>
        )}
      </main>

      <footer className="site-footer">
        Reality Check · honest pre-mortems, not encouragement
      </footer>
    </div>
  );
}
