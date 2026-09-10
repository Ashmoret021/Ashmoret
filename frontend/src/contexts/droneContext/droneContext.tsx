import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Drone } from "../../types";

type DroneContextType = {
  drones: Drone[];
  loading: boolean;
  error: string | null;
  refreshDrones: () => Promise<void>;
};

const DroneContext = createContext<DroneContextType | undefined>(undefined);

export function DroneProvider({ children }: { children: ReactNode }) {
  const [drones, setDrones] = useState<Drone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDrones = async () => {
    try {
      setLoading(true);
      setError(null);

      //TODO: change the api endpoint to match server
      const response = await fetch("/api/drones");

      if (!response.ok) {
        throw new Error("Failed to fetch drones");
      }

      const data: Drone[] = await response.json();

      setDrones(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDrones();
  }, []);

  return (
    <DroneContext.Provider
      value={{
        drones,
        loading,
        error,
        refreshDrones,
      }}
    >
      {children}
    </DroneContext.Provider>
  );
}

export function useDroneContext() {
  const context = useContext(DroneContext);

  if (!context) {
    throw new Error("useDroneContext must be used inside DroneProvider");
  }

  return context;
}
