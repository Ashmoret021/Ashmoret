// Sample inventory: replace these names and quantities with the real systems.
export const SYSTEM_TYPES = [
  { id: 'system-a', name: 'Interceptor', count: 3, color: '#1565c0' },
  { id: 'system-b', name: 'Sample system B', count: 2, color: '#7b1fa2' },
  { id: 'system-c', name: 'Sample system C', count: 1, color: '#00796b' },
] as const;

export type SystemType = (typeof SYSTEM_TYPES)[number];

export interface PlacedSystem {
  id: number;
  typeId: SystemType['id'];
  latitude: number;
  longitude: number;
}

export function availableCount(type: SystemType, placed: PlacedSystem[]) {
  return type.count - placed.filter((system) => system.typeId === type.id).length;
}
