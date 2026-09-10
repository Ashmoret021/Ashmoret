export type AttackSideConfig = {
  [key: string]: unknown;
  route?: Array<{
    latitude: number;
    longitude: number;
    asl?: number;
    agl?: number;
  }>;
  threatType?: string;
  targetType?: string;
  tactic?: string;
  notes?: string;
};

export type AttackSide = {
  id: number;
  name: string;
  description?: string | null;
  scenarioId?: string | null;
  dronesGroupId?: number | null;
  droneId?: number | null;
  launcherId?: number | null;
  active: boolean;
  config: AttackSideConfig;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAttackSideInput = {
  name: string;
  description?: string | null;
  scenario_id?: string;
  drones_group_id?: number | null;
  drone_id?: number | null;
  launcher_id?: number | null;
  active?: boolean;
  config?: AttackSideConfig;
};
