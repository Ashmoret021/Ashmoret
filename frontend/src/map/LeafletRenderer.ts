/**
 * map/LeafletRenderer.ts
 *
 * Developer 3 – Mission 3.4
 *
 * The sole class responsible for drawing everything on the Leaflet map.
 *
 * Rules (spec §23):
 *  ✗ Never decides what to intercept, impact, or fire.
 *  ✗ Never mutates SimulationState.
 *  ✗ Never stores logic in a Marker or Polyline.
 *  ✓ Reads SimulationState and VisualEventQueue on every render frame.
 *  ✓ Creates/removes markers only when entities enter or leave the world.
 *  ✓ Updates only marker.setLatLng() within a frame.
 *  ✓ Runs its own 60 FPS requestAnimationFrame loop, decoupled from logic.
 *
 * NOTE: Icons are placeholder CircleMarkers in this mission.
 *       Mission 3.5 (icons.ts / *Layer.ts) will replace them with SVG icons.
 *
 * Spec references: §23, §24, §26, §36, §37
 */

import L from 'leaflet';
import { getState } from '../simulation/SimulationContext';
import type { DroneSimState, LauncherSimState } from '../simulation/SimulationContext';
import { visualEventQueue } from '../visual/VisualEventQueue';
import type { InterceptorVisualState, LatLng } from '../visual/types';
import { VISUAL_INTERCEPT_DURATION_S } from '../visual/types';
import {
  createDefenseIcon,
  createImpactIcon,
  createInterceptionFlashIcon,
  createInterceptorIcon,
  createThreatIcon,
} from './icons';

// ---------------------------------------------------------------------------
// Helper: convert project Location / LatLng to Leaflet LatLng tuple
// ---------------------------------------------------------------------------
function toLeaflet(pos: LatLng): L.LatLngTuple {
  return [pos.latitude, pos.longitude];
}

// ---------------------------------------------------------------------------
// Helper: calculate heading / bearing in degrees between two points
// ---------------------------------------------------------------------------
function calculateBearing(start: LatLng, end: LatLng): number {
  const lat1 = (start.latitude * Math.PI) / 180;
  const lat2 = (end.latitude * Math.PI) / 180;
  const dLon = ((end.longitude - start.longitude) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// ---------------------------------------------------------------------------
// LeafletRenderer
// ---------------------------------------------------------------------------

export class LeafletRenderer {
  // The Leaflet map instance
  private readonly map: L.Map;

  // ── Marker pools (keyed by entity ID) ────────────────────────────────────
  private threatMarkers = new Map<string, L.Marker>();
  private interceptorMarkers = new Map<string, L.Marker>();
  private defenseMarkers = new Map<string, L.Marker>();
  private impactMarkers = new Map<string, L.Marker>();
  private flashMarkers = new Map<string, L.Marker>();

  // ── Polyline trajectory pools (Mission 3.5) ──────────────────────────────
  private threatPolylines = new Map<string, L.Polyline>();
  private interceptorPolylines = new Map<string, L.Polyline>();

  // ── Layer visibility toggles (spec §25) ──────────────────────────────────
  private showThreatRoutes = true;
  private showInterceptorRoutes = true;

  // ── Interceptor visual state ──────────────────────────────────────────────
  private interceptorStates = new Map<string, InterceptorVisualState>();

  // ── RAF loop ──────────────────────────────────────────────────────────────
  private rafHandle: number | null = null;

  // ── Prune timer ───────────────────────────────────────────────────────────
  private lastPruneTime = 0;
  private readonly PRUNE_INTERVAL_S = 5;

  constructor(map: L.Map) {
    this.map = map;
  }

  // ---------------------------------------------------------------------------
  // Layer Toggles
  // ---------------------------------------------------------------------------

  setShowThreatRoutes(show: boolean): void {
    this.showThreatRoutes = show;
    for (const poly of this.threatPolylines.values()) {
      if (show) {
        if (!this.map.hasLayer(poly)) poly.addTo(this.map);
      } else {
        poly.remove();
      }
    }
  }

  setShowInterceptorRoutes(show: boolean): void {
    this.showInterceptorRoutes = show;
    for (const poly of this.interceptorPolylines.values()) {
      if (show) {
        if (!this.map.hasLayer(poly)) poly.addTo(this.map);
      } else {
        poly.remove();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  start(): void {
    if (this.rafHandle !== null) return;
    this.scheduleFrame();
  }

  stop(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  reset(): void {
    this.stop();
    this.clearAllMarkers();
    this.clearAllPolylines();
    this.interceptorStates.clear();
    visualEventQueue.clear();
    this.lastPruneTime = 0;
  }

  /**
   * Clears all visual state (markers, polylines, interceptors) without stopping
   * the RAF render loop. Call this on simulation restart so the loop can
   * immediately start drawing fresh entities on the next tick.
   */
  resetVisuals(): void {
    this.clearAllMarkers();
    this.clearAllPolylines();
    this.interceptorStates.clear();
    this.lastPruneTime = 0;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  registerInterceptorVisualState(ivs: InterceptorVisualState): void {
    this.interceptorStates.set(ivs.id, { ...ivs });

    // Build interceptor route polyline
    const path: L.LatLngTuple[] = [
      toLeaflet(ivs.startPosition),
      toLeaflet(ivs.interceptPoint),
    ];
    const polyline = L.polyline(path, {
      color: '#38bdf8',
      weight: 2,
      dashArray: '4, 4',
      opacity: 0.8,
    });

    if (this.showInterceptorRoutes) {
      polyline.addTo(this.map);
    }
    this.interceptorPolylines.set(ivs.id, polyline);
  }

  initDefenseSystems(): void {
    // Clear any existing defense markers before building new ones
    for (const m of this.defenseMarkers.values()) m.remove();
    this.defenseMarkers.clear();

    const state = getState();
    for (const [id, launcher] of Object.entries(state.launchers)) {
      this.ensureDefenseMarker(String(id), launcher);
    }
  }

  // ---------------------------------------------------------------------------
  // Private — RAF scheduling
  // ---------------------------------------------------------------------------

  private scheduleFrame(): void {
    this.rafHandle = requestAnimationFrame(() => this.renderFrame());
  }

  private renderFrame(): void {
    this.scheduleFrame();

    const state = getState();
    const t = state.simulationTime;

    // Always keep defense markers visible (even while idle/paused)
    this.ensureAllDefenseMarkers(state.launchers);

    // Only advance simulation visuals when running or paused (not idle)
    if (state.status === 'idle') return;

    // 1. Advance VisualEventQueue lifecycle (status updates bidirectionally based on simulationTime)
    visualEventQueue.tick(t);

    // 2. Render threats and threat routes
    this.renderThreats(state.threats, t);

    // 3. Animate interceptors
    this.renderInterceptors(t);

    // 4. Render visual events
    this.renderVisualEvents(t);

    // 5. Cleanup inactive entities
    this.removeInactiveEntities(state.threats);
  }

  // ---------------------------------------------------------------------------
  // Private — Threats & Routes
  // ---------------------------------------------------------------------------

  private renderThreats(threats: Record<number, DroneSimState>, simulationTime: number): void {
    // Build a set of threat IDs currently in their explosion boom window
    const boomingThreatIds = new Set<string>();
    const flightDuration = VISUAL_INTERCEPT_DURATION_S;
    for (const [, ivs] of this.interceptorStates) {
      if (ivs.outcome === 'success') {
        const elapsed = simulationTime - ivs.launchTime;
        if (elapsed >= flightDuration) {
          boomingThreatIds.add(String(ivs.targetId));
        }
      }
    }

    for (const threat of Object.values(threats)) {
      const id = String(threat.id);
      const isVisible =
        (threat.logicalStatus === 'active' || threat.logicalStatus === 'interceptPending') &&
        !boomingThreatIds.has(id); // Hide during boom phase

      if (!isVisible) {
        // Remove the marker if it exists (e.g. scrubbed into boom window)
        if (this.threatMarkers.has(id)) {
          this.threatMarkers.get(id)!.remove();
          this.threatMarkers.delete(id);
        }
        continue;
      }

      const pos: LatLng = {
        latitude: threat.location.latitude,
        longitude: threat.location.longitude,
      };

      // Ensure planned flight route polyline is displayed
      if (!this.threatPolylines.has(id) && threat.route && threat.route.length > 0) {
        const polyPoints: L.LatLngTuple[] = threat.route.map((p) => [p.latitude, p.longitude]);
        const polyline = L.polyline(polyPoints, {
          color: '#ef4444',
          weight: 2.5,
          opacity: 0.65,
          dashArray: '6, 6',
        });
        if (this.showThreatRoutes) {
          polyline.addTo(this.map);
        }
        this.threatPolylines.set(id, polyline);
      }

      if (this.threatMarkers.has(id)) {
        const marker = this.threatMarkers.get(id)!;
        marker.setLatLng(toLeaflet(pos));
        marker.setIcon(createThreatIcon(threat.heading, `איום ${id}`, threat.type));
      } else {
        const marker = L.marker(toLeaflet(pos), {
          icon: createThreatIcon(threat.heading, `איום ${id}`, threat.type),
        });
        marker.addTo(this.map);
        this.threatMarkers.set(id, marker);
      }
    }
  }

  private removeInactiveEntities(threats: Record<number, DroneSimState>): void {
    // Remove threat markers and route polylines when intercepted/impacted
    for (const [id, marker] of this.threatMarkers) {
      const threat = threats[Number(id)];
      const shouldRemove =
        !threat ||
        threat.logicalStatus === 'intercepted' ||
        threat.logicalStatus === 'impacted';

      if (shouldRemove) {
        marker.remove();
        this.threatMarkers.delete(id);

        const poly = this.threatPolylines.get(id);
        if (poly) {
          poly.remove();
          this.threatPolylines.delete(id);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private — Defense Systems
  // ---------------------------------------------------------------------------

  private ensureDefenseMarker(id: string, launcher: LauncherSimState): void {
    if (this.defenseMarkers.has(id)) return;

    const pos: LatLng = {
      latitude: launcher.location.latitude,
      longitude: launcher.location.longitude,
    };

    const marker = L.marker(toLeaflet(pos), {
      icon: createDefenseIcon(`סוללה ${id}`, launcher.type),
    });
    marker.addTo(this.map);
    this.defenseMarkers.set(id, marker);
  }

  private ensureAllDefenseMarkers(launchers: Record<number, LauncherSimState>): void {
    for (const [id, launcher] of Object.entries(launchers)) {
      this.ensureDefenseMarker(String(id), launcher);
    }
  }

  // ---------------------------------------------------------------------------
  // Private — Interceptors & Interception Explosions (animated & scrubbable)
  // ---------------------------------------------------------------------------

  private renderInterceptors(simulationTime: number): void {
    const flightDuration = VISUAL_INTERCEPT_DURATION_S; // 3 seconds
    const explosionDuration = 1.2; // 1.2 seconds explosion boom effect

    for (const [id, ivs] of this.interceptorStates) {
      const elapsed = simulationTime - ivs.launchTime;

      // 1. Before launch: hide missile, explosion, and trajectory route
      if (elapsed < 0) {
        if (this.interceptorMarkers.has(id)) {
          this.interceptorMarkers.get(id)!.remove();
          this.interceptorMarkers.delete(id);
        }
        if (this.flashMarkers.has(id)) {
          this.flashMarkers.get(id)!.remove();
          this.flashMarkers.delete(id);
        }
        const poly = this.interceptorPolylines.get(id);
        if (poly && this.map.hasLayer(poly)) {
          poly.remove();
        }
        continue;
      }

      // Ensure trajectory route is restored when elapsed >= 0
      const poly = this.interceptorPolylines.get(id);
      if (poly && this.showInterceptorRoutes && !this.map.hasLayer(poly)) {
        poly.addTo(this.map);
      }

      // 2. Flying phase: (0 <= elapsed < 3s)
      if (elapsed >= 0 && elapsed < flightDuration) {
        // Hide explosion flash if present
        if (this.flashMarkers.has(id)) {
          this.flashMarkers.get(id)!.remove();
          this.flashMarkers.delete(id);
        }

        const progress = Math.min(1, elapsed / flightDuration);
        ivs.progress = progress;
        const pos = lerpLatLng(ivs.startPosition, ivs.interceptPoint, progress);
        ivs.position = pos;

        const bearing = calculateBearing(ivs.startPosition, ivs.interceptPoint);

        if (this.interceptorMarkers.has(id)) {
          this.interceptorMarkers.get(id)!.setLatLng(toLeaflet(pos));
        } else {
          const marker = L.marker(toLeaflet(pos), {
            icon: createInterceptorIcon(bearing),
          });
          marker.addTo(this.map);
          this.interceptorMarkers.set(id, marker);
        }
      }
      // 3. Explosion / Boom Flash phase: (3s <= elapsed < 4.2s)
      else if (elapsed >= flightDuration && elapsed < flightDuration + explosionDuration && ivs.outcome === 'success') {
        // Hide flying missile marker
        if (this.interceptorMarkers.has(id)) {
          this.interceptorMarkers.get(id)!.remove();
          this.interceptorMarkers.delete(id);
        }

        // Show flash explosion icon at the exact intercept point (created once per explosion)
        if (!this.flashMarkers.has(id)) {
          const flash = L.marker(toLeaflet(ivs.interceptPoint), {
            icon: createInterceptionFlashIcon(),
          });
          flash.addTo(this.map);
          this.flashMarkers.set(id, flash);
        }
      }
      // 4. After explosion: hide both missile and explosion
      else {
        if (this.interceptorMarkers.has(id)) {
          this.interceptorMarkers.get(id)!.remove();
          this.interceptorMarkers.delete(id);
        }
        if (this.flashMarkers.has(id)) {
          this.flashMarkers.get(id)!.remove();
          this.flashMarkers.delete(id);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private — Visual Events (impact markers)
  // ---------------------------------------------------------------------------

  private renderVisualEvents(simulationTime: number): void {
    const activeEvents = visualEventQueue.getActiveEvents();
    const activeIds = new Set(activeEvents.map((e) => e.id));

    // Remove impact markers that are no longer active (e.g. scrubbed back before the impact occurred)
    for (const [id, marker] of this.impactMarkers) {
      if (!activeIds.has(id)) {
        marker.remove();
        this.impactMarkers.delete(id);
      }
    }

    for (const event of activeEvents) {
      if (event.type !== 'impact' || !event.position) continue;
      const id = event.id;

      if (!this.impactMarkers.has(id)) {
        const marker = L.marker(toLeaflet(event.position), {
          icon: createImpactIcon(`נפילה T+${Math.floor(simulationTime)}s`),
        });
        marker.addTo(this.map);
        this.impactMarkers.set(id, marker);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private — cleanup
  // ---------------------------------------------------------------------------

  private clearAllPolylines(): void {
    for (const p of this.threatPolylines.values()) p.remove();
    for (const p of this.interceptorPolylines.values()) p.remove();
    this.threatPolylines.clear();
    this.interceptorPolylines.clear();
  }

  private clearAllMarkers(): void {
    for (const m of this.threatMarkers.values()) m.remove();
    for (const m of this.interceptorMarkers.values()) m.remove();
    for (const m of this.defenseMarkers.values()) m.remove();
    for (const m of this.impactMarkers.values()) m.remove();
    for (const m of this.flashMarkers.values()) m.remove();

    this.threatMarkers.clear();
    this.interceptorMarkers.clear();
    this.defenseMarkers.clear();
    this.impactMarkers.clear();
    this.flashMarkers.clear();
  }
}

// ---------------------------------------------------------------------------
// Pure helper — exported for tests and VisualEventBuilder
// ---------------------------------------------------------------------------

/**
 * Linearly interpolates between two LatLng positions.
 * @param t value in [0, 1] (0 = a, 1 = b)
 */
export function lerpLatLng(a: LatLng, b: LatLng, t: number): LatLng {
  const c = Math.max(0, Math.min(1, t));
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * c,
    longitude: a.longitude + (b.longitude - a.longitude) * c,
  };
}
