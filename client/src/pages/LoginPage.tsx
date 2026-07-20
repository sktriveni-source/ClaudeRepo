import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    api.listUsers().then(setUsers).catch(() => setError("Could not reach the AI-PLM API."));
  }, []);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  async function handleLogin(email: string) {
    setPending(email);
    setError(null);
    try {
      await login(email);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span className="dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "#2454ff" }} />
          AI-PLM
        </div>
        <div className="login-sub">
          Choose a demo user to sign in. Each role has different access to products, change
          requests, and audit history.
        </div>
        {error && <div className="badge red" style={{ marginBottom: 12 }}>{error}</div>}
        {users.map((u) => (
          <div key={u.id} className="role-option" onClick={() => handleLogin(u.email)}>
            <div>
              <div className="name">{u.name}</div>
              <div className="role">{u.roleLabel} &middot; {u.email}</div>
            </div>
            <button className="btn primary" disabled={pending === u.email}>
              {pending === u.email ? "Signing in..." : "Sign in"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
