export type PlacementMode = 'auto' | 'manual';

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
export type ScenarioType = 'single' | 'multi';

export interface ScenarioItem {
  id: string;
  title: string;
  severity: SeverityLevel;
  type: ScenarioType;
  typeLabel: string; // 'חד-זירתי' | 'רב-זירתי'
  droneCount: number;
  entryPoints: string[]; // e.g. ['צפון'], ['צפון', 'מזרח']
  droneTypes: string[]; // e.g. ['A', 'B'], ['A', 'B', 'C']
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
