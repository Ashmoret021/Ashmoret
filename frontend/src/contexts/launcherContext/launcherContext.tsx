import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Launcher } from "../../types";

type LauncherContextType = {
  launchers: Launcher[];
  loading: boolean;
  error: string | null;
  refreshLaunchers: () => Promise<void>;
};

const LauncherContext = createContext<LauncherContextType | undefined>(undefined);

export function LauncherProvider({ children }: { children: ReactNode }) {
  const [launchers, setLaunchers] = useState<Launcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLaunchers = async () => {
    try {
      setLoading(true);
      setError(null);

      //TODO: change the api endpoint to match server
      const response = await fetch("/api/launchers");

      if (!response.ok) {
        throw new Error("Failed to fetch launchers");
      }

      const data: Launcher[] = await response.json();

      setLaunchers(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLaunchers();
  }, []);

  return (
    <LauncherContext.Provider
      value={{
        launchers,
        loading,
        error,
        refreshLaunchers,
      }}
    >
      {children}
    </LauncherContext.Provider>
  );
}

export function useLauncherContext() {
  const context = useContext(LauncherContext);

  if (!context) {
    throw new Error("useLauncherContext must be used inside LauncherProvider");
  }

  return context;
}
