export interface Scenario {
  id: string;
  name: string;
  drones_group_id: number;
  launchers_group_id: number;
  type: string;
}

export type CreateScenarioInput = Scenario;
export type UpdateScenarioInput = Partial<Omit<Scenario, 'id'>>;

export interface DronesGroup {
  id: number;
  name: string;
  description?: string;
}

export type CreateDronesGroupInput = DronesGroup;
export type UpdateDronesGroupInput = Partial<Omit<DronesGroup, 'id'>>;

export interface LaunchersGroup {
  id: number;
  name: string;
  description?: string;
}

export type CreateLaunchersGroupInput = LaunchersGroup;
export type UpdateLaunchersGroupInput = Partial<Omit<LaunchersGroup, 'id'>>;

export interface Drone {
  id: number;
  drones_group_id: number;
  longitude: number;
  latitude: number;
  asl: number;
  agl: number;
  heading: number;
  velocity: number;
  type: number;
}

export type CreateDroneInput = Drone;
export type UpdateDroneInput = Partial<Omit<Drone, 'id'>>;

export interface Launcher {
  id: number;
  launchers_group_id: number;
  longitude: number;
  latitude: number;
  asl: number;
  agl: number;
  type: number;
  amount: number;
  active: boolean;
}

export type CreateLauncherInput = Launcher;
export type UpdateLauncherInput = Partial<Omit<Launcher, 'id'>>;

export interface LauncherAmmunition {
  launcher_id: number;
  interceptor_type_id: number;
  amount: number;
}

export type CreateLauncherAmmunitionInput = LauncherAmmunition;
export type UpdateLauncherAmmunitionInput = Pick<LauncherAmmunition, 'amount'>;

export interface DroneType {
  id: number;
  name: string;
}

export type CreateDroneTypeInput = DroneType;
export type UpdateDroneTypeInput = Partial<Omit<DroneType, 'id'>>;

export interface InterceptorType {
  id: number;
  name: string;
}

export type CreateInterceptorTypeInput = InterceptorType;
export type UpdateInterceptorTypeInput = Partial<Omit<InterceptorType, 'id'>>;

export interface LauncherType {
  id: number;
  name: string;
  reload_time: number;
}

export type CreateLauncherTypeInput = LauncherType;
export type UpdateLauncherTypeInput = Partial<Omit<LauncherType, 'id'>>;
