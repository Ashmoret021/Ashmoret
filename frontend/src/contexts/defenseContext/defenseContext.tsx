// DefenseContext.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Defense } from "../../types";

type DefenseContextType = {
  defenses: Defense[];
  loading: boolean;
  error: string | null;
  refreshDefenses: () => Promise<void>;
};

const DefenseContext = createContext<DefenseContextType | undefined>(undefined);

export function DefenseProvider({ children }: { children: ReactNode }) {
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDefenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/defenses");

      if (!response.ok) {
        throw new Error("Failed to fetch defenses");
      }

      const data: Defense[] = await response.json();

      setDefenses(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDefenses();
  }, []);

  return (
    <DefenseContext.Provider
      value={{
        defenses,
        loading,
        error,
        refreshDefenses,
      }}
    >
      {children}
    </DefenseContext.Provider>
  );
}

export function useDefenseContext() {
  const context = useContext(DefenseContext);

  if (!context) {
    throw new Error("useDefenseContext must be used inside DefenseProvider");
  }

  return context;
}
