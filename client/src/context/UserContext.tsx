import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface Persona {
  name: string;
  role: "Product Manager" | "Approver";
}

export const PERSONAS: Persona[] = [
  { name: "Priya Nair", role: "Product Manager" },
  { name: "Carlos Mendes", role: "Product Manager" },
  { name: "Jordan Lee", role: "Approver" },
  { name: "Aiko Tanaka", role: "Approver" },
];

interface UserContextValue {
  persona: Persona;
  setPersona: (p: Persona) => void;
  actorLabel: string;
}

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY = "plm.persona";

function loadPersona(): Persona {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return PERSONAS[0];
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [persona, setPersonaState] = useState<Persona>(loadPersona);

  const setPersona = (p: Persona) => {
    setPersonaState(p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  };

  const value = useMemo(
    () => ({
      persona,
      setPersona,
      actorLabel: `${persona.name} (${persona.role})`,
    }),
    [persona]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
