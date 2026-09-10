import { Scenario } from "../../../types/types";

export type PlacementMode = 'auto' | 'manual';

export enum Direction {
  NORTH = 'צפון',
  EAST = 'מזרח',
  SOUTH = 'דרום',
  WEST = 'מערב',
}

export enum ScenarioType {
  SINGLE_AREA = 'חד-זירתי',
  MULTIPLE_AREAS = 'רב-זירתי',
};

export interface InterceptorItem {
  id: string;
  name: string;
  category: string;
  available: number;
  total: number;
  status: 'ready' | 'depleted';
  icon: 'crosshair' | 'radar' | 'lightning' | 'shield' | 'rocket' | 'globe' | 'laser' | 'grid';
}

export type SeverityLevel = 'low' | 'high' | 'extreme';

/**
 * UI-facing scenario shape. It IS the DB scenario (see `Scenario` in
 * types/types.ts) plus a few UI-only optional extras (`severity`,
 * `entryPoints`) that don't come from the backend. Components that read
 * those extras must handle them being undefined when the data comes from
 * the real API.
 */
export interface ScenarioItem extends Scenario {
  severity?: SeverityLevel;
  entryPoints?: Direction[];
}


export interface TacticalMarker {
  id: string;
  label?: string;
  type: 'system_rec' | 'manual_placed' | 'drone' | 'entry_point' | 'outpost';
  position: [number, number];
  direction?: 'north' | 'south' | 'east' | 'west';
  subLabel?: string;
}

export interface ScenarioDetails {
  id: string;
  name: string;
  status: string;
  simId: string;
  connected: boolean;
  safeMode: boolean;
}

/**
 * EventSimulation data model fitted to backend Scenario API and Simulation records
 */
export interface EventSimulation {
  id: string;
  scenario_id: string;
  scenario_name: string;
  drones_count: number;
  drones_group_id?: number;
  launchers_group_id?: number;
  scenario_type?: 'חד-זירתי' | 'רב-זירתי' | string;
  execution_date: string; // e.g. "9.9.2026 16:43"
  duration: string; // e.g. "00:13:45"
  score: number; // e.g. 85
}

