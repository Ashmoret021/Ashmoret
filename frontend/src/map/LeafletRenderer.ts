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

// ---------------------------------------------------------------------------
// Colour palette for placeholder markers (replaced by icons.ts in Mission 3.5)
// ---------------------------------------------------------------------------
const COLOURS = {
  threat: '#ef4444',        // red-500
  interceptor: '#3b82f6',   // blue-500
  defense: '#22c55e',       // green-500
  impact: '#f97316',        // orange-500
  intercept: '#facc15',     // yellow-400  (explosion flash)
} as const;

// ---------------------------------------------------------------------------
// Helper: convert project Location / LatLng to Leaflet LatLng tuple
// ---------------------------------------------------------------------------
function toLeaflet(pos: LatLng): L.LatLngExpression {
  return [pos.latitude, pos.longitude];
}

// ---------------------------------------------------------------------------
// LeafletRenderer
// ---------------------------------------------------------------------------

export class LeafletRenderer {
  // The Leaflet map instance — owned by the React component, passed in here.
  private readonly map: L.Map;

  // ── Marker pools (keyed by entity ID) ────────────────────────────────────
  // We use L.CircleMarker because it renders efficiently on the Canvas renderer.
  // Mission 3.5 will swap these for SVG DivIcon markers.
  private threatMarkers = new Map<string, L.CircleMarker>();
  private interceptorMarkers = new Map<string, L.CircleMarker>();
  private defenseMarkers = new Map<string, L.CircleMarker>();
  private impactMarkers = new Map<string, L.CircleMarker>();
  /** Temporary "explosion flash" circles at intercept points */
  private flashMarkers = new Map<string, L.CircleMarker>();

  // ── Interceptor visual state ──────────────────────────────────────────────
  // Owned here because visual progress is a render concern, not a logic concern.
  private interceptorStates = new Map<string, InterceptorVisualState>();

  // ── RAF loop ──────────────────────────────────────────────────────────────
  private rafHandle: number | null = null;

  // ── Prune timer ───────────────────────────────────────────────────────────
  private lastPruneTime = 0;
  private readonly PRUNE_INTERVAL_S = 5; // prune finished events every 5 sim-seconds

  // ---------------------------------------------------------------------------
  constructor(map: L.Map) {
    this.map = map;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Starts the 60 FPS render loop.
   * Safe to call multiple times — will not start a second loop.
   */
  start(): void {
    if (this.rafHandle !== null) return;
    this.scheduleFrame();
  }

  /**
   * Stops the render loop without clearing markers.
   * Call on Pause (the map stays visible, it's just frozen).
   */
  stop(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  /**
   * Full reset: clears all markers and interceptor states, resets prune timer.
   * Must be called on Restart (spec §29).
   */
  reset(): void {
    this.stop();
    this.clearAllMarkers();
    this.interceptorStates.clear();
    visualEventQueue.clear();
    this.lastPruneTime = 0;
  }

  // ---------------------------------------------------------------------------
  // Public API — called by simulation engine / VisualEventBuilder consumer
  // ---------------------------------------------------------------------------

  /**
   * Registers a new in-flight interceptor for the renderer to animate.
   * Called immediately after processEngagementDecision() returns a bundle.
   *
   * @example
   * const bundle = processEngagementDecision(decision, getState());
   * if (bundle) {
   *   visualEventQueue.enqueue(bundle.visualEvent);
   *   renderer.registerInterceptorVisualState(bundle.interceptorState);
   * }
   */
  registerInterceptorVisualState(ivs: InterceptorVisualState): void {
    this.interceptorStates.set(ivs.id, { ...ivs });
  }

  /**
   * Initialises static defense-system markers.
   * Call once after loadScenario(), before start().
   */
  initDefenseSystems(): void {
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
    // Always reschedule first so we never lose the loop on an error.
    this.scheduleFrame();

    const state = getState();

    // Only render when the simulation is running or paused (not idle).
    if (state.status === 'idle') return;

    const t = state.simulationTime;

    // ── 1. Advance VisualEventQueue lifecycle ────────────────────────────
    visualEventQueue.tick(t);

    // ── 2. Periodic prune ───────────────────────────────────────────────
    if (t - this.lastPruneTime >= this.PRUNE_INTERVAL_S) {
      visualEventQueue.pruneFinished();
      this.lastPruneTime = t;
    }

    // ── 3. Render threats ────────────────────────────────────────────────
    this.renderThreats(state.threats);

    // ── 4. Render defense systems (static — only ensure they exist) ──────
    this.ensureAllDefenseMarkers(state.launchers);

    // ── 5. Animate interceptors ──────────────────────────────────────────
    this.renderInterceptors(t);

    // ── 6. Render active visual events (impacts, flashes) ───────────────
    this.renderVisualEvents(t);

    // ── 7. Garbage-collect removed entities ─────────────────────────────
    this.removeInactiveEntities(state.threats);
  }

  // ---------------------------------------------------------------------------
  // Private — Threats
  // ---------------------------------------------------------------------------

  private renderThreats(threats: Record<number, DroneSimState>): void {
    for (const threat of Object.values(threats)) {
      const id = String(threat.id);
      const isVisible =
        threat.logicalStatus === 'active' ||
        threat.logicalStatus === 'interceptPending';

      if (!isVisible) continue;

      const pos: LatLng = {
        latitude: threat.location.latitude,
        longitude: threat.location.longitude,
      };

      if (this.threatMarkers.has(id)) {
        // Entity already on map — just update position (spec §24)
        this.threatMarkers.get(id)!.setLatLng(toLeaflet(pos));
      } else {
        // New threat — create marker once
        const marker = L.circleMarker(toLeaflet(pos), {
          radius: 7,
          color: COLOURS.threat,
          fillColor: COLOURS.threat,
          fillOpacity: 0.9,
          weight: 2,
        });
        // Tooltip shows threat ID for debugging (removed in production polish)
        marker.bindTooltip(`Threat ${id}`, { permanent: false, direction: 'top' });
        marker.addTo(this.map);
        this.threatMarkers.set(id, marker);
      }
    }
  }

  private removeInactiveEntities(threats: Record<number, DroneSimState>): void {
    // Remove threat markers for entities that are now intercepted or impacted
    for (const [id, marker] of this.threatMarkers) {
      const threat = threats[Number(id)];
      const shouldRemove =
        !threat ||
        threat.logicalStatus === 'intercepted' ||
        threat.logicalStatus === 'impacted';

      if (shouldRemove) {
        marker.remove();
        this.threatMarkers.delete(id);
      }
    }

    // Remove interceptor markers for finished visual states
    for (const [id, ivs] of this.interceptorStates) {
      if (ivs.visualStatus === 'finished') {
        this.interceptorMarkers.get(id)?.remove();
        this.interceptorMarkers.delete(id);
        this.interceptorStates.delete(id);
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

    const marker = L.circleMarker(toLeaflet(pos), {
      radius: 10,
      color: COLOURS.defense,
      fillColor: COLOURS.defense,
      fillOpacity: 0.85,
      weight: 3,
    });
    marker.bindTooltip(`Defense ${id}`, { permanent: true, direction: 'top' });
    marker.addTo(this.map);
    this.defenseMarkers.set(id, marker);
  }

  private ensureAllDefenseMarkers(launchers: Record<number, LauncherSimState>): void {
    for (const [id, launcher] of Object.entries(launchers)) {
      this.ensureDefenseMarker(String(id), launcher);
    }
  }

  // ---------------------------------------------------------------------------
  // Private — Interceptors (animated)
  // ---------------------------------------------------------------------------

  private renderInterceptors(simulationTime: number): void {
    for (const [id, ivs] of this.interceptorStates) {
      if (ivs.visualStatus === 'finished') continue;

      // ── Compute progress ───────────────────────────────────────────
      const elapsed = simulationTime - ivs.launchTime;
      const progress = Math.min(1, elapsed / VISUAL_INTERCEPT_DURATION_S);
      ivs.progress = progress;

      // ── Interpolate position ────────────────────────────────────────
      const pos = lerpLatLng(ivs.startPosition, ivs.interceptPoint, progress);
      ivs.position = pos;

      // ── Lifecycle transitions ───────────────────────────────────────
      if (progress >= 1 && ivs.visualStatus === 'flying') {
        ivs.visualStatus = ivs.outcome === 'success' ? 'exploding' : 'missing';
        this.handleInterceptorArrival(id, ivs);
      } else if (ivs.visualStatus === 'exploding' || ivs.visualStatus === 'missing') {
        // Brief animation frame — transition to finished after 0.5s sim time
        if (elapsed >= VISUAL_INTERCEPT_DURATION_S + 0.5) {
          ivs.visualStatus = 'finished';
        }
      }

      // ── Update marker position ──────────────────────────────────────
      if (ivs.visualStatus === 'flying') {
        if (this.interceptorMarkers.has(id)) {
          this.interceptorMarkers.get(id)!.setLatLng(toLeaflet(pos));
        } else {
          const marker = L.circleMarker(toLeaflet(ivs.startPosition), {
            radius: 5,
            color: COLOURS.interceptor,
            fillColor: COLOURS.interceptor,
            fillOpacity: 0.9,
            weight: 2,
          });
          marker.bindTooltip(`→ ${ivs.targetId}`, { permanent: false, direction: 'top' });
          marker.addTo(this.map);
          this.interceptorMarkers.set(id, marker);
        }
      }
    }
  }

  /**
   * Called once when an interceptor reaches its intercept point.
   * Shows a flash marker (success = yellow, failure = grey).
   */
  private handleInterceptorArrival(id: string, ivs: InterceptorVisualState): void {
    // Remove the interceptor travel marker
    this.interceptorMarkers.get(id)?.remove();
    this.interceptorMarkers.delete(id);

    // Show a flash circle at the intercept point
    const flashColour = ivs.outcome === 'success' ? COLOURS.intercept : '#94a3b8';
    const flash = L.circleMarker(toLeaflet(ivs.interceptPoint), {
      radius: ivs.outcome === 'success' ? 16 : 10,
      color: flashColour,
      fillColor: flashColour,
      fillOpacity: 0.7,
      weight: 2,
    });
    flash.addTo(this.map);
    this.flashMarkers.set(id, flash);

    // Auto-remove flash after 1 second (wall clock, not sim time — it's UX)
    setTimeout(() => {
      flash.remove();
      this.flashMarkers.delete(id);
    }, 1000);
  }

  // ---------------------------------------------------------------------------
  // Private — Visual Events (impact markers)
  // ---------------------------------------------------------------------------

  private renderVisualEvents(simulationTime: number): void {
    const activeEvents = visualEventQueue.getActiveEvents();

    for (const event of activeEvents) {
      if (event.type !== 'impact' || !event.position) continue;
      const id = event.id;

      if (!this.impactMarkers.has(id)) {
        // Create a persistent impact marker (lingers until Restart per spec §22)
        const marker = L.circleMarker(toLeaflet(event.position), {
          radius: 12,
          color: COLOURS.impact,
          fillColor: COLOURS.impact,
          fillOpacity: 0.6,
          weight: 3,
        });
        // Outer ring effect via a second, larger transparent circle
        const ring = L.circleMarker(toLeaflet(event.position), {
          radius: 20,
          color: COLOURS.impact,
          fillColor: 'transparent',
          fillOpacity: 0,
          weight: 1.5,
        });
        marker.bindTooltip(`💥 ${event.targetId ?? 'Impact'} @${Math.floor(simulationTime)}s`, {
          permanent: false,
        });
        marker.addTo(this.map);
        ring.addTo(this.map);
        this.impactMarkers.set(id, marker);
        // Store ring under a derived key so it's cleaned up on reset
        this.impactMarkers.set(`${id}__ring`, ring);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private — cleanup
  // ---------------------------------------------------------------------------

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
