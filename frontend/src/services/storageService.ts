import { PlacedDrone, DroneWave, Scenario } from "../types/drone";

const STORAGE_KEYS = {
  PLACED_DRONES: "ashmoret_placed_drones",
  ATTACK_WAVES: "ashmoret_attack_waves",
  ATTACK_METADATA: "ashmoret_attack_metadata",
  SCENARIOS: "ashmoret_scenarios",
  ACTIVE_SCENARIO_ID: "ashmoret_active_scenario_id",
};

export interface AttackMetadata {
  attackName: string;
  attackDescription: string;
}

export const storageService = {
  // Scenarios
  getStoredScenarios(): Scenario[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCENARIOS);
      if (!data) return [];
      return JSON.parse(data) as Scenario[];
    } catch (e) {
      console.error("Failed to load scenarios from storage:", e);
      return [];
    }
  },

  saveScenario(scenario: Scenario): void {
    try {
      const scenarios = this.getStoredScenarios();
      const existingIndex = scenarios.findIndex((s) => s.id === scenario.id);
      if (existingIndex >= 0) {
        scenarios[existingIndex] = scenario;
      } else {
        scenarios.unshift(scenario);
      }
      localStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(scenarios));
    } catch (e) {
      console.error("Failed to save scenario to storage:", e);
    }
  },

  getScenarioById(id: string): Scenario | null {
    const scenarios = this.getStoredScenarios();
    return scenarios.find((s) => s.id === id) || null;
  },

  deleteScenario(id: string): void {
    try {
      const scenarios = this.getStoredScenarios().filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(scenarios));
    } catch (e) {
      console.error("Failed to delete scenario from storage:", e);
    }
  },

  getActiveScenarioId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_SCENARIO_ID);
    } catch {
      return null;
    }
  },

  setActiveScenarioId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SCENARIO_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SCENARIO_ID);
      }
    } catch (e) {
      console.error("Failed to set active scenario ID:", e);
    }
  },

  // Active Draft Drones
  getStoredDrones(): PlacedDrone[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLACED_DRONES);
      if (!data) return [];
      return JSON.parse(data) as PlacedDrone[];
    } catch (e) {
      console.error("Failed to load placed drones from storage:", e);
      return [];
    }
  },

  saveStoredDrones(drones: PlacedDrone[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PLACED_DRONES, JSON.stringify(drones));
    } catch (e) {
      console.error("Failed to save placed drones to storage:", e);
    }
  },

  // Active Draft Waves
  getStoredWaves(): DroneWave[] | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTACK_WAVES);
      if (!data) return null;
      return JSON.parse(data) as DroneWave[];
    } catch (e) {
      console.error("Failed to load attack waves from storage:", e);
      return null;
    }
  },

  saveStoredWaves(waves: DroneWave[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTACK_WAVES, JSON.stringify(waves));
    } catch (e) {
      console.error("Failed to save attack waves to storage:", e);
    }
  },

  // Active Draft Metadata
  getStoredMetadata(): AttackMetadata | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTACK_METADATA);
      if (!data) return null;
      return JSON.parse(data) as AttackMetadata;
    } catch (e) {
      console.error("Failed to load attack metadata from storage:", e);
      return null;
    }
  },

  saveStoredMetadata(meta: AttackMetadata): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTACK_METADATA, JSON.stringify(meta));
    } catch (e) {
      console.error("Failed to save attack metadata to storage:", e);
    }
  },

  clearAllDrones(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PLACED_DRONES);
    } catch (e) {
      console.error("Failed to clear placed drones:", e);
    }
  },
};

