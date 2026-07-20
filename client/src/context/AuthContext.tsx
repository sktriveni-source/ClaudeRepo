import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  can: (permission: Permission) => boolean;
}

export type Permission =
  | "products:write"
  | "products:delete"
  | "documents:write"
  | "documents:delete"
  | "changeRequests:write"
  | "changeRequests:approve"
  | "audit:read"
  | "ai:insights";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    "products:write",
    "products:delete",
    "documents:write",
    "documents:delete",
    "changeRequests:write",
    "changeRequests:approve",
    "audit:read",
    "ai:insights",
  ],
  product_manager: [
    "products:write",
    "documents:write",
    "documents:delete",
    "changeRequests:write",
    "changeRequests:approve",
    "audit:read",
    "ai:insights",
  ],
  engineer: ["products:write", "documents:write", "changeRequests:write"],
  compliance: ["audit:read", "ai:insights"],
  viewer: [],
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string) => {
    const { token, user: loggedInUser } = await api.login(email);
    setToken(token);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const can = useCallback(
    (permission: Permission) => (user ? ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false : false),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
