// Shared domain types.
// The shapes here mirror the JSON returned by the backend REST API (which in
// turn maps 1:1 to the PostgreSQL tables under the `scenario_management`
// schema — see backend/SQL/init.sql). Keeping the frontend types aligned with
// the DB schema means mock data and real API responses are structurally
// interchangeable.

/** Runtime-only geographic location used by the simulation engine. Not part
 *  of the DB row shape — drones/launchers store their coordinates as flat
 *  columns, and the simulation lifts them into this struct when it needs to
 *  track current position over time. */
export type Location = {
  longitude: number;
  latitude: number;
  asl: number;
  agl: number;
};

// ---------------------------------------------------------------------------
// Reference-catalog types (drone_type, launcher_type, interceptor_type)
// ---------------------------------------------------------------------------

/** Frontend catalog of known drone_type rows. Numeric values are arbitrary
 *  labels used by the mock data; when real data comes from the API the
 *  `type` field on a Drone will simply hold the DB row's integer id. */
export enum DroneType {
  SkyMiteC7,
  LoadBeeM2,
  FalconLongX4,
  NanoSwarmQ9,
}

export enum LauncherType {
  ShieldNestLite,
  IronHookSR,
  HorizonEyeMX,
  CloudFenceArea,
}

export const ReloadTime: Record<LauncherType, number> = {
  [LauncherType.ShieldNestLite]: 0.7,
  [LauncherType.IronHookSR]: 1,
  [LauncherType.HorizonEyeMX]: 0.6,
  [LauncherType.CloudFenceArea]: 0.3,
};

export enum InterceptorType {
  BuzzStop15,
  NetWing30,
  DartFoxS,
  SpearMini70,
  SkyLanceM,
  FalconClipH,
  SwarmMist5,
  MicroNetR,
}

export const InterceptorRange: Record<InterceptorType, number> = {
  [InterceptorType.BuzzStop15]: 10000,
  [InterceptorType.NetWing30]: 10000,
  [InterceptorType.DartFoxS]: 30000,
  [InterceptorType.SpearMini70]: 30000,
  [InterceptorType.SkyLanceM]: 50000,
  [InterceptorType.FalconClipH]: 70000,
  [InterceptorType.SwarmMist5]: 5000,
  [InterceptorType.MicroNetR]: 7000,
};

// ---------------------------------------------------------------------------
// Row types matching the DB tables
// ---------------------------------------------------------------------------

/** Mirrors `scenario.drone` — flat coordinates + int FK to drone_type. */
export type Drone = {
  id: number;
  dronesGroupId: number;
  longitude: number;
  latitude: number;
  asl: number;
  agl: number;
  heading: number;
  velocity: number;
  /** FK to drone_type.id */
  type: number;
};

/** Mirrors `scenario.launcher_ammunition`. Not populated on the default
 *  scenario/launcher GET responses — fetch separately when needed. */
export type LauncherAmmunition = {
  launcherId: number;
  interceptorTypeId: number;
  amount: number;
};

/** Mirrors `scenario.launcher`. `ammunition` is an optional relation the
 *  API may or may not populate. */
export type Launcher = {
  id: number;
  launchersGroupId: number;
  longitude: number;
  latitude: number;
  asl: number;
  agl: number;
  /** FK to launcher_type.id */
  type: number;
  amount: number;
  active: boolean;
  ammunition?: LauncherAmmunition[];
};

/** Mirrors `scenario.drones_group`. */
export type DroneGroup = {
  id: number;
  name: string;
  description?: string;
  drones: Drone[];
};

/** Mirrors `scenario.launchers_group`. */
export type LauncherGroup = {
  id: number;
  name: string;
  description?: string;
  launchers: Launcher[];
};

/** Mirrors `scenario.scenario`. `dronesGroup` / `launchersGroup` are
 *  populated when the API is asked to include relations (as it is for
 *  GET /api/scenarios). */
export type Scenario = {
  id: string;
  name: string;
  dronesGroupId: number;
  launchersGroupId: number;
  type: string;
  dronesGroup?: DroneGroup;
  launchersGroup?: LauncherGroup;
};

export type ScenerioCreationType = {
  name: string;
  type: string;
  dronesGroupId: number;
  launchersGroupId: number;
};
