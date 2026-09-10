import type { DroneSimState } from './SimulationContext';
import type { Location } from '../../../types/types';

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistance(a: Location, b: Location): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const chord =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(chord));
}

function routeLength(route: Location[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += haversineDistance(route[i - 1], route[i]);
  return total;
}

export function calculateProgress(route: Location[], velocity: number, elapsedTime: number): number {
  if (route.length < 2 || velocity <= 0) return 0;
  const total = routeLength(route);
  if (total === 0) return 1;
  return Math.min(1, (velocity * elapsedTime) / total);
}

export function calculatePositionAlongRoute(route: Location[], progress: number): Location {
  const p = Math.max(0, Math.min(1, progress));
  if (route.length === 0) return { latitude: 0, longitude: 0, asl: 0, agl: 0 };
  if (route.length === 1 || p <= 0) return { ...route[0] };
  if (p >= 1) return { ...route[route.length - 1] };
  const segCount = route.length - 1;
  const segSize = 1 / segCount;
  const segIdx = Math.min(Math.floor(p / segSize), segCount - 1);
  const localT = (p - segIdx * segSize) / segSize;
  const a = route[segIdx];
  const b = route[segIdx + 1];
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * localT,
    longitude: a.longitude + (b.longitude - a.longitude) * localT,
    asl: a.asl + (b.asl - a.asl) * localT,
    agl: a.agl + (b.agl - a.agl) * localT,
  };
}

export function activateWaitingThreats(
  threats: Record<number, DroneSimState>,
  simTime: number,
): Record<number, DroneSimState> {
  let changed = false;
  const next = { ...threats };
  for (const [idStr, threat] of Object.entries(threats)) {
    if (threat.logicalStatus === 'waiting' && simTime >= threat.startTime) {
      next[Number(idStr)] = {
        ...threat,
        logicalStatus: 'active',
        visualStatus: 'flying',
        progress: 0,
        location: threat.route[0] ?? threat.location,
      };
      changed = true;
    }
  }
  return changed ? next : threats;
}

export function advanceThreatPositions(
  threats: Record<number, DroneSimState>,
  simTime: number,
): Record<number, DroneSimState> {
  let changed = false;
  const next = { ...threats };
  for (const [idStr, threat] of Object.entries(threats)) {
    if (threat.logicalStatus !== 'active' && threat.logicalStatus !== 'interceptPending') continue;
    const elapsed = simTime - threat.startTime;
    if (elapsed < 0) continue;
    const progress = calculateProgress(threat.route, threat.velocity, elapsed);
    const location = calculatePositionAlongRoute(threat.route, progress);
    next[Number(idStr)] = { ...threat, progress, location };
    changed = true;
  }
  return changed ? next : threats;
}
