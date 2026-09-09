export type Drone = {
  id: number;
  drones_group_id: number;
  longitude: number;
  latitude: number;
  asl: number;
  agl: number;
  heading: number;
  velocity: number;
  type: number;
};

export type DroneStatus = "ready" | "active" | "deployed";

export interface PlacedDrone {
  id: string;
  name: string;
  waveId: number;
  waveIndex: number;
  droneType: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  status: DroneStatus;
  placedAt: string; // ISO string
}

export interface DroneWave {
  id: number;
  open: boolean;
  droneType: string;
  border: string;
  quantity: number;
  angle: number;
  direction: string;
  altitude: number;
  simulationArea: boolean;
}

export interface WavePlacementSummary {
  waveId: number;
  droneType: string;
  required: number;
  placed: number;
  remaining: number;
  isComplete: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  waves: DroneWave[];
  drones: PlacedDrone[];
  savedAt: string;
}
