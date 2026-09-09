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

export interface TacticalMarker {
  id: string;
  label?: string;
  type: 'system_rec' | 'manual_placed' | 'drone' | 'entry_point' | 'outpost';
  position: [number, number]; // [lat, lng]
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
