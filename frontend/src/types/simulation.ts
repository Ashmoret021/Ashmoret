import { DroneGroup, LauncherGroup } from "./types";

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
 * UI-facing scenario shape used across the app. It intentionally accepts both
 * the DB-shaped fields and the lighter mock-data fields that are used by older
 * UI components and scenario lists.
 */
export interface ScenarioItem {
  id: string;
  name?: string;
  title?: string;
  dronesGroupId?: number;
  launchersGroupId?: number;
  type?: string;
  typeLabel?: string;
  severity?: SeverityLevel;
  droneCount?: number;
  entryPoints?: Direction[];
  droneTypes?: string[];
  dronesGroup?: DroneGroup;
  launchersGroup?: LauncherGroup;
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

