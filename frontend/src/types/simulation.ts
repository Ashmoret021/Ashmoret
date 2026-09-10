import { Drone, Launcher } from "../../../types/types.ts";

export enum Direction {
  NORTH = 'צפון',
  EAST = 'מזרח',
  SOUTH = 'דרום',
  WEST = 'מערב',
}

export enum EventType {
  SINGLE_AREA = 'חד-זירתי',
  MULTIPLE_AREAS = 'רב-זירתי',
}

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
export enum ScenarioType {
  SINGLE_AREA = 'חד-זירתי',
  MULTIPLE_AREAS = 'רב-זירתי',
};

export interface ScenarioItem {
  id: string;
  title: string;
  severity: SeverityLevel;
  type: ScenarioType;
  drones: Drone[];
  entryPoints: Direction[]; // e.g. ['צפון'], ['צפון', 'מזרח']
  launchers: Launcher[];
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
