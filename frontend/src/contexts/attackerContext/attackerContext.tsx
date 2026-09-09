// AttackerContext.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Attacker } from "../../types";

type AttackerContextType = {
  attackers: Attacker[];
  loading: boolean;
  error: string | null;
  refreshAttackers: () => Promise<void>;
};

const AttackerContext = createContext<AttackerContextType | undefined>(
  undefined,
);

export function AttackerProvider({ children }: { children: ReactNode }) {
  const [attackers, setAttackers] = useState<Attacker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAttackers = async () => {
    try {
      setLoading(true);
      setError(null);

      //TODO: change the api endpoint to match server
      const response = await fetch("/api/attackers");

      if (!response.ok) {
        throw new Error("Failed to fetch attackers");
      }

      const data: Attacker[] = await response.json();

      setAttackers(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAttackers();
  }, []);

  return (
    <AttackerContext.Provider
      value={{
        attackers,
        loading,
        error,
        refreshAttackers,
      }}
    >
      {children}
    </AttackerContext.Provider>
  );
}

export function useAttackerContext() {
  const context = useContext(AttackerContext);

  if (!context) {
    throw new Error("useAttackerContext must be used inside AttackerProvider");
  }

  return context;
}
