/**
 * visual/VisualEventBuilder.ts
 *
 * Developer 3 – Mission 3.2
 *
 * Transforms an `EngagementDecision` (from the Algorithm API / Dev 2) into:
 *   1. An `InterceptorVisualState` — drives the interceptor marker on the map.
 *   2. A `VisualEvent`            — queued for time-based rendering.
 *
 * This service contains NO rendering logic. It only builds plain data objects
 * that LeafletRenderer and VisualEventQueue consume.
 *
 * Spec references: §12, §14, §15, §16
 */

import type { Location } from '../../../types/types';
import type {
  SimulationState,
  DroneSimState,
  LauncherSimState,
} from '../simulation/SimulationContext';
import {
  type VisualEvent,
  type InterceptorVisualState,
  type LatLng,
  VISUAL_INTERCEPT_DURATION_S,
} from './types';

import type { EngagementDecision } from '../algorithm/types';

// ---------------------------------------------------------------------------
// Output bundle returned by processEngagementDecision
// ---------------------------------------------------------------------------
export interface EngagementVisualBundle {
  interceptorState: InterceptorVisualState;
  visualEvent: VisualEvent;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Earth radius in metres used for haversine distance. */
const EARTH_RADIUS_M = 6_371_000;

/** Convert degrees to radians. */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine great-circle distance between two map points (metres).
 */
function haversineDistance(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const chord =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(chord));
}

/**
 * Sum of straight-line distances for each segment of a route (metres).
 * Returns 0 for routes with fewer than 2 waypoints.
 */
function calculateRouteLength(route: Location[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    total += haversineDistance(route[i - 1], route[i]);
  }
  return total;
}

/**
 * Linear interpolation between two LatLng points.
 * `t` is a value in [0, 1] where 0 = a, 1 = b.
 */
function lerpLatLng(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

/**
 * Returns the LatLng a threat will be at when its internal progress reaches
 * `targetProgress` (clamped to [0, 1]).
 *
 * The route is a polyline; we walk segments until we find the right span.
 */
function getPositionAtProgress(route: Location[], targetProgress: number): LatLng {
  const p = Math.max(0, Math.min(1, targetProgress));

  if (route.length === 0) {
    return { latitude: 0, longitude: 0 };
  }
  if (route.length === 1 || p <= 0) {
    return { latitude: route[0].latitude, longitude: route[0].longitude };
  }
  if (p >= 1) {
    const last = route[route.length - 1];
    return { latitude: last.latitude, longitude: last.longitude };
  }

  // Walk segments, each occupying (1 / (n-1)) of total progress space.
  const segmentCount = route.length - 1;
  const segmentSize = 1 / segmentCount;
  const segmentIndex = Math.floor(p / segmentSize);
  const clampedIndex = Math.min(segmentIndex, segmentCount - 1);
  const segmentLocalT = (p - clampedIndex * segmentSize) / segmentSize;

  return lerpLatLng(route[clampedIndex], route[clampedIndex + 1], segmentLocalT);
}

/**
 * Projects a threat's position `dt` simulation-seconds into the future.
 *
 * Uses `drone.velocity` (m/s) and the total route length to compute how much
 * additional progress the threat accumulates, then resolves the coordinate.
 *
 * @param threat   The DroneSimState to project.
 * @param dt       Simulation time delta in seconds to project forward.
 */
function getThreatPositionAfter(threat: DroneSimState, dt: number): LatLng {
  const routeLength = calculateRouteLength(threat.route);

  if (routeLength === 0 || threat.velocity <= 0) {
    // Stationary or degenerate route: stay at current position.
    return { latitude: threat.location.latitude, longitude: threat.location.longitude };
  }

  const VISUAL_SPEED_SCALE = 25;
  const distanceTravelled = threat.velocity * VISUAL_SPEED_SCALE * dt;
  const progressDelta = distanceTravelled / routeLength;
  const futureProgress = Math.min(1, threat.progress + progressDelta);

  return getPositionAtProgress(threat.route, futureProgress);
}

/**
 * Generates a unique interceptor ID for this engagement.
 * Format: "int-<targetId>-t<simulationTime>-<random suffix>"
 */
function generateInterceptorId(targetId: string, simulationTime: number): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `int-${targetId}-t${Math.floor(simulationTime)}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * Processes a single `EngagementDecision` and returns the visual data needed
 * to render the interception sequence.
 *
 * Call this inside the simulation tick after receiving AlgorithmResponse, once
 * per engagement decision:
 *
 * ```ts
 * for (const decision of response.engagements) {
 *   const bundle = processEngagementDecision(decision, getState());
 *   if (bundle) {
 *     visualEventQueue.enqueue(bundle.visualEvent);
 *     // hand bundle.interceptorState to LeafletRenderer
 *   }
 * }
 * ```
 *
 * Returns `null` if the required threat or defense system cannot be found in
 * the current simulation state (e.g. already intercepted / removed).
 *
 * Spec §14, §15
 */
export function processEngagementDecision(
  decision: EngagementDecision,
  state: SimulationState,
): EngagementVisualBundle | null {
  const { simulationTime } = state;

  // ------------------------------------------------------------------
  // 1. Resolve the threat drone
  // ------------------------------------------------------------------
  // Threats are keyed by numeric ID in SimulationState; the algorithm
  // sends string IDs. Try both string equality and numeric coercion.
  const threat = findThreat(state, decision.targetId);
  if (!threat) {
    console.warn(
      `[VisualEventBuilder] Threat "${decision.targetId}" not found or not active. Skipping engagement.`,
    );
    return null;
  }

  // ------------------------------------------------------------------
  // 2. Resolve the defense system (launcher)
  // ------------------------------------------------------------------
  const launcher = findLauncher(state, decision.defenseSystemId);
  if (!launcher) {
    console.warn(
      `[VisualEventBuilder] Launcher "${decision.defenseSystemId}" not found. Skipping engagement.`,
    );
    return null;
  }

  // ------------------------------------------------------------------
  // 3. Calculate the intercept point (spec §15)
  //    "Where will the threat be in VISUAL_INTERCEPT_DURATION_S seconds?"
  // ------------------------------------------------------------------
  const interceptPoint = getThreatPositionAfter(threat, VISUAL_INTERCEPT_DURATION_S);

  // ------------------------------------------------------------------
  // 4. Build the InterceptorVisualState
  // ------------------------------------------------------------------
  const interceptorId = generateInterceptorId(decision.targetId, simulationTime);
  const launcherPosition: LatLng = {
    latitude: launcher.location.latitude,
    longitude: launcher.location.longitude,
  };

  const interceptorState: InterceptorVisualState = {
    id: interceptorId,
    type: decision.interceptorType,
    sourceSystemId: decision.defenseSystemId,
    targetId: decision.targetId,
    visualStatus: 'flying',
    launchTime: simulationTime,
    position: { ...launcherPosition },   // starts at the launcher
    startPosition: { ...launcherPosition },
    interceptPoint,
    progress: 0,
    outcome: decision.result ?? 'success',
  };

  // ------------------------------------------------------------------
  // 5. Build the VisualEvent
  //    startTime = now (launch), endTime = when animation completes
  // ------------------------------------------------------------------
  const visualEvent: VisualEvent = {
    id: `evt-interception-${decision.targetId}-t${Math.floor(simulationTime)}`,
    type: 'interception',
    startTime: simulationTime,
    endTime: simulationTime + VISUAL_INTERCEPT_DURATION_S,
    targetId: decision.targetId,
    interceptorId,
    position: interceptPoint,
    status: 'pending',
  };

  return { interceptorState, visualEvent };
}

/**
 * Builds a standalone `VisualEvent` for a threat impact (no interceptor involved).
 * Call this from ImpactEngine when a threat reaches progress >= 1.
 *
 * Spec §21
 */
export function buildImpactEvent(
  threatId: string,
  position: LatLng,
  simulationTime: number,
): VisualEvent {
  return {
    id: `evt-impact-${threatId}-t${Math.floor(simulationTime)}`,
    type: 'impact',
    startTime: simulationTime,
    // Impact marker lingers; no endTime — the renderer keeps it until Restart.
    endTime: undefined,
    targetId: threatId,
    interceptorId: undefined,
    position,
    status: 'pending',
  };
}

/**
 * Builds a `VisualEvent` for a miss (interceptor fails to hit the threat).
 * Call this when an InterceptorVisualState transitions to 'missing'.
 *
 * Spec §20 (failed branch)
 */
export function buildMissEvent(
  interceptorId: string,
  targetId: string,
  position: LatLng,
  simulationTime: number,
): VisualEvent {
  return {
    id: `evt-miss-${interceptorId}-t${Math.floor(simulationTime)}`,
    type: 'miss',
    startTime: simulationTime,
    endTime: simulationTime + 1.5, // brief miss flash
    targetId,
    interceptorId,
    position,
    status: 'pending',
  };
}

// ---------------------------------------------------------------------------
// Private helpers for state lookup
// ---------------------------------------------------------------------------

/**
 * Finds an active threat drone by string or numeric ID.
 * Only returns threats whose logical status allows engagement
 * (`active` or `interceptPending`).
 */
function findThreat(state: SimulationState, targetId: string): DroneSimState | undefined {
  // Numeric key lookup
  const numericId = Number(targetId);
  if (!Number.isNaN(numericId) && state.threats[numericId]) {
    const t = state.threats[numericId];
    if (t.logicalStatus === 'active' || t.logicalStatus === 'interceptPending') {
      return t;
    }
  }

  // Fallback: scan all threats for string ID match
  for (const t of Object.values(state.threats)) {
    if (String(t.id) === targetId) {
      if (t.logicalStatus === 'active' || t.logicalStatus === 'interceptPending') {
        return t;
      }
    }
  }

  return undefined;
}

/**
 * Finds a launcher by string or numeric defense-system ID.
 */
function findLauncher(state: SimulationState, systemId: string): LauncherSimState | undefined {
  const numericId = Number(systemId);
  if (!Number.isNaN(numericId) && state.launchers[numericId]) {
    return state.launchers[numericId];
  }

  // Fallback: string match
  for (const l of Object.values(state.launchers)) {
    if (String(l.id) === systemId) {
      return l;
    }
  }

  return undefined;
}
